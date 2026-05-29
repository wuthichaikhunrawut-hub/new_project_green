import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private orgService: OrganizationsService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
  ) {}

  async register(registerDto: any) {
    const existing = await this.usersService.findByEmail(
      registerDto.userData.email,
    );
    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // 1. Create Organization
    const org = await this.orgService.create({
      ...registerDto.orgData,
    });

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(registerDto.userData.password, 12);

    // 3. Create User
    const user = await this.usersService.create({
      ...registerDto.userData,
      password_hash: hashedPassword,
      organization: org,
      user_profile: {
        first_name: registerDto.userData.username || registerDto.userData.email.split('@')[0],
        last_name: 'ผู้ดูแลระบบ',
        phone: '-'
      }
    });

    // The first user who registers a new organization becomes the ORG_ADMIN
    const primaryRole = UserRole.ORG_ADMIN;
    await this.usersService.assignRoleToUser(user.id, primaryRole);

    // 4. Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: org.id,
      role: primaryRole,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, role: payload.role },
      organization: org,
    };
  }

  async login(loginDto: any) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const role = await this.usersService.getPrimaryRoleForUser(user.id);
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.organization?.id,
      role,
    };
    const fullUser = await this.usersService.findOne(user.id);
    const result = {
      access_token: await this.jwtService.signAsync(payload),
      user: { 
        id: user.id, 
        email: user.email, 
        role: payload.role,
        username: fullUser?.user_profile?.first_name || user.email.split('@')[0],
        user_profile: fullUser?.user_profile
      },
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            industry_type: user.organization.industry_type,
          }
        : null,
    };

    await this.auditLogsService.logAction(
      user.id,
      'LOGIN',
      `User logged in: ${user.email}`,
    );

    return result;
  }

  async registerAssessor(registerDto: any) {
    const existing = await this.usersService.findByEmail(
      registerDto.userData.email,
    );
    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // 1. Hash password
    const hashedPassword = await bcrypt.hash(registerDto.userData.password, 12);

    // 2. Create User as ASSESSOR
    const user = await this.usersService.create({
      email: registerDto.userData.email,
      password: registerDto.userData.password,
    });

    await this.usersService.assignRoleToUser(user.id, UserRole.ASSESSOR);

    // 3. Create Profiles
    await this.usersService.update(user.id, {
      user_profile: {
        first_name: registerDto.profileData.firstName,
        last_name: registerDto.profileData.lastName,
        phone: registerDto.profileData.phone,
      },
      assessor_profile: {
        license_number: registerDto.profileData.license_number,
        years_experience: registerDto.profileData.years_experience,
        education_background: registerDto.profileData.education_background,
        qualification_file_url: registerDto.profileData.qualification_file_url,
        verification_status: 'Pending',
      },
      bank_account: {
        bank_name: registerDto.profileData.bank_name,
        account_no: registerDto.profileData.bank_account_no,
        account_name: registerDto.profileData.bank_account_name,
      },
    });

    // Fetch the complete profile to return
    const profile = await this.usersService.findOne(user.id);

    // 4. Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: UserRole.ASSESSOR,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, role: UserRole.ASSESSOR },
      profile,
    };
  }
}
