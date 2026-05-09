import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { AssessorProfile } from './entities/assessor-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole as UserRoleLink } from './entities/user-role.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AssessorProfile)
    private assessorProfileRepository: Repository<AssessorProfile>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRoleLink)
    private userRolesRepository: Repository<UserRoleLink>,
    private auditLogsService: AuditLogsService
  ) {}

  private normalizeRoleName(role: string): string {
    return String(role || '').trim().toUpperCase();
  }

  private async findExistingRoleByName(roleName: string): Promise<Role | undefined> {
    const normalized = this.normalizeRoleName(roleName);
    const allRoles = await this.rolesRepository.find();
    return allRoles.find(r => this.normalizeRoleName(r.role_name) === normalized);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.rolesRepository.find({ order: { id: 'ASC' } });
  }

  async ensureRoleExists(roleName: string): Promise<Role> {
    const existing = await this.findExistingRoleByName(roleName);
    if (existing) {
      return existing;
    }

    const role = this.rolesRepository.create({ role_name: roleName });
    return this.rolesRepository.save(role);
  }

  async assignRoleToUser(userId: number, roleName: string): Promise<void> {
    const role = await this.ensureRoleExists(roleName);
    const exists = await this.userRolesRepository.findOne({ where: { user_id: userId, role_id: role.id } });
    if (!exists) {
      await this.userRolesRepository.save({ user_id: userId, role_id: role.id } as UserRoleLink);
    }
  }

  async setRoleForUser(userId: number, roleName: string): Promise<void> {
    await this.userRolesRepository.delete({ user_id: userId });
    await this.assignRoleToUser(userId, roleName);
  }

  async getPrimaryRoleForUser(userId: number): Promise<string> {
    const links = await this.userRolesRepository.find({ where: { user_id: userId } });
    if (!links || links.length === 0) return UserRole.USER;

    const roleIds = links.map(l => l.role_id);
    // Use find+In instead of deprecated findByIds
    const roles = await this.rolesRepository.find({ where: { id: In(roleIds) } });
    const normalizedRoleNames = roles.map(r => this.normalizeRoleName(r.role_name));

    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.SYSTEM_ADMIN))) {
      return UserRole.SYSTEM_ADMIN;
    }
    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.ORG_ADMIN))) {
      return UserRole.ORG_ADMIN;
    }
    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.ADMIN))) {
      return UserRole.SYSTEM_ADMIN;
    }
    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.ASSESSOR))) {
      return UserRole.ASSESSOR;
    }
    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.EXECUTIVE))) {
      return UserRole.EXECUTIVE;
    }
    if (normalizedRoleNames.includes(this.normalizeRoleName(UserRole.EMPLOYEE))) {
      return UserRole.EMPLOYEE;
    }
    return UserRole.USER;
  }

  async hasAnyAdmin(): Promise<boolean> {
    const adminRoleNames = [UserRole.SYSTEM_ADMIN, UserRole.ORG_ADMIN, UserRole.ADMIN];
    const allRoles = await this.rolesRepository.find();
    const adminRoleIds = allRoles
      .filter(r => adminRoleNames.some(name => this.normalizeRoleName(r.role_name) === this.normalizeRoleName(name)))
      .map(r => r.id);

    if (adminRoleIds.length === 0) {
      return false;
    }

    const count = await this.userRolesRepository.count({ where: { role_id: In(adminRoleIds) } });
    return count > 0;
  }

  async findAll(role?: string): Promise<User[]> {
    const users = await this.usersRepository.find({
      relations: ['organization'],
      select: ['id', 'email', 'is_active', 'created_at'],
      order: { created_at: 'DESC' }
    });
    
    for (const user of users) {
      (user as any).role = await this.getPrimaryRoleForUser(user.id);
      (user as any).username = user.email ? user.email.split('@')[0] : 'User';
    }
    
    if (role) {
      return users.filter(user => (user as any).role === role);
    }
    
    return users;
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { id }, 
      relations: ['organization'],
      select: ['id', 'email', 'is_active', 'created_at'] 
    });
    
    if (user) {
      (user as any).role = await this.getPrimaryRoleForUser(user.id);
      (user as any).username = user.email ? user.email.split('@')[0] : 'User';
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: ILike(email) },
      relations: ['organization']
    });
  }

  async createAssessorProfile(userId: number, profileData: any): Promise<AssessorProfile> {
    const profile = this.assessorProfileRepository.create({
      ...profileData,
      user: { id: userId }
    });
    return this.assessorProfileRepository.save(profile) as unknown as Promise<AssessorProfile>;
  }

  async create(userData: any): Promise<User> {
    const dataToSave = { ...userData, is_active: true };
    if (userData.password) {
      dataToSave.password_hash = await bcrypt.hash(userData.password, 10);
      delete dataToSave.password;
    }
    const user = this.usersRepository.create(dataToSave);
    const saved = (await this.usersRepository.save(user)) as unknown as User;
    await this.auditLogsService.logAction(undefined, 'CREATE_USER', `Created user account: ${saved.email}`);

    const desiredRole = userData?.role ? userData.role : UserRole.USER;
    await this.assignRoleToUser(saved.id, desiredRole);
    return saved;
  }

  async update(id: number, updateData: any): Promise<User | null> {
    const { assessor_profile, role, username, organizationName, organization, password, ...userData } = updateData;

    if (password) {
      userData.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userData).length > 0) {
      await this.usersRepository.update(id, userData);
    }

    if (role) {
      await this.setRoleForUser(id, role);
    }

    if (assessor_profile) {
      let profile: AssessorProfile | null = await this.assessorProfileRepository.findOne({ where: { user: { id } } });
      if (!profile) {
          profile = this.assessorProfileRepository.create({ ...assessor_profile, user: { id } } as any) as unknown as AssessorProfile;
      } else {
          Object.assign(profile, assessor_profile);
      }
      await this.assessorProfileRepository.save(profile!);
    }

    const updated = await this.findOne(id);
    await this.auditLogsService.logAction(undefined, 'UPDATE_USER', `Updated user account: ${updated?.email || id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.delete(id);
    if (user) {
      await this.auditLogsService.logAction(undefined, 'DELETE_USER', `Deleted user account: ${user.email}`);
    }
  }
}
