import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { AssessorProfile } from './entities/assessor-profile.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AssessorProfile)
    private assessorProfileRepository: Repository<AssessorProfile>,
    private auditLogsService: AuditLogsService
  ) {}

  async findAll(role?: string): Promise<User[]> {
    const where: any = {};
    if (role) where.role = role;
    return this.usersRepository.find({
      where,
      relations: ['organization'],
      select: ['id', 'username', 'email', 'role', 'is_active', 'assessor_verified', 'created_at'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { id }, 
      relations: ['organization', 'assessor_profile'],
      select: ['id', 'username', 'email', 'role', 'is_active', 'assessor_verified', 'bio', 'bank_name', 'bank_account_name', 'bank_account_number', 'created_at'] 
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['organization'] });
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ], 
      relations: ['organization', 'assessor_profile'] 
    });
  }

  async createAssessorProfile(userId: string, profileData: any): Promise<AssessorProfile> {
    const profile = this.assessorProfileRepository.create({
      ...profileData,
      user: { id: userId }
    });
    return this.assessorProfileRepository.save(profile) as unknown as Promise<AssessorProfile>;
  }

  async create(userData: any): Promise<User> {
    // Hash password if provided as plain text
    const dataToSave = { ...userData, is_active: true };
    if (userData.password) {
      dataToSave.password_hash = await bcrypt.hash(userData.password, 10);
      delete dataToSave.password; // Don't store plain
    }
    const user = this.usersRepository.create(dataToSave);
    const saved = (await this.usersRepository.save(user)) as unknown as User;
    await this.auditLogsService.logAction(undefined, 'CREATE_USER', `Created user account: ${saved.email}`);
    return saved;
  }

  async update(id: string, updateData: any): Promise<User | null> {
    const { assessor_profile, ...userData } = updateData;

    // Update main user data
    if (Object.keys(userData).length > 0) {
      await this.usersRepository.update(id, userData);
    }

    // Update assessor profile if exists
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

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.delete(id);
    if (user) {
      await this.auditLogsService.logAction(undefined, 'DELETE_USER', `Deleted user account: ${user.email}`);
    }
  }
}
