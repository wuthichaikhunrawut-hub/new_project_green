import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { AssessorProfile } from './entities/assessor-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole as UserRoleLink } from './entities/user-role.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(AssessorProfile)
    private assessorProfileRepository: Repository<AssessorProfile>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRoleLink)
    private userRolesRepository: Repository<UserRoleLink>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
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

  async findAll(roleName?: string): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.user_profile', 'profile')
      .leftJoinAndSelect('user.assessor_profile', 'assessor_profile')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.bank_accounts', 'bank_accounts')
      .orderBy('user.created_at', 'DESC');

    if (roleName) {
      query.andWhere('UPPER(roles.role_name) = UPPER(:roleName)', { roleName });
    }

    const users = await query.getMany();

    // Map for backward compatibility
    return users.map(user => ({
      ...user,
      role: user.roles && user.roles.length > 0 ? user.roles[0].role_name : 'User',
      username: user.user_profile?.first_name || user.email.split('@')[0],
      bio: user.assessor_profile?.education_background || '-',
      assessor_verified: user.assessor_profile?.verification_status === 'Verified' || user.assessor_profile?.verification_status === 'VERIFIED'
    })) as any;
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({ 
      where: { id }, 
      relations: ['organization', 'user_profile', 'assessor_profile', 'roles']
    });
    
    if (!user) return null;

    return {
      ...user,
      role: user.roles && user.roles.length > 0 ? user.roles[0].role_name : 'User',
      username: user.user_profile?.first_name || user.email.split('@')[0]
    } as any;
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
    const { 
      user_profile, 
      assessor_profile, 
      role, 
      username, 
      organizationName, 
      organization, 
      password,
      id: userId,
      created_at,
      updated_at,
      assessor_verified,
      bank_account,
      ...userData 
    } = updateData;

    if (password) {
      userData.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userData).length > 0) {
      await this.usersRepository.update(id, userData);
    }

    if (role) {
      await this.setRoleForUser(id, role);
    }

    if (assessor_profile || assessor_verified !== undefined) {
      let profile: AssessorProfile | null = await this.assessorProfileRepository.findOne({ where: { user: { id } } });
      if (!profile) {
          profile = this.assessorProfileRepository.create({ ...assessor_profile, user: { id } } as any) as unknown as AssessorProfile;
      } else if (assessor_profile) {
          Object.assign(profile, assessor_profile);
      }
      
      if (assessor_verified !== undefined) {
          profile.verification_status = assessor_verified ? 'Verified' : 'Pending';
      }

      await this.assessorProfileRepository.save(profile!);
    }

    if (user_profile) {
      let profile: UserProfile | null = await this.userProfileRepository.findOne({ where: { user: { id } } });
      if (!profile) {
        profile = new UserProfile();
        Object.assign(profile, user_profile);
        (profile as any).user = { id };
      } else {
        Object.assign(profile, user_profile);
      }
      await this.userProfileRepository.save(profile);
    }

    if (bank_account) {
      let account = await this.bankAccountRepository.findOne({ where: { user: { id } } });
      if (!account) {
        const newAccount = this.bankAccountRepository.create({ ...bank_account, user: { id }, is_primary: true } as any);
        account = Array.isArray(newAccount) ? newAccount[0] : newAccount;
      } else {
        Object.assign(account, bank_account);
      }
      if (account) {
        await this.bankAccountRepository.save(account);
      }
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
