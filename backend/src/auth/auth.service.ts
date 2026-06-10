import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private orgService: OrganizationsService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
    private mailService: MailService,
    private configService: ConfigService,
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
        first_name: registerDto.userData.firstName || registerDto.userData.email.split('@')[0],
        last_name: registerDto.userData.lastName || 'ผู้ดูแลระบบ',
        phone: registerDto.userData.phone || '-'
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
    const result = {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, role: payload.role },
      organization: org,
    };

    // Send Verification Email (Non-blocking)
    const userName = user.user_profile?.first_name || user.email.split('@')[0];
    this.sendVerificationEmail(user.id, user.email, userName).catch(e => {
      this.logger.error(`Failed to send verification email to ${user.email}`, e.stack);
    });

    return result;
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
    const result = {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, role: UserRole.ASSESSOR },
      profile,
    };

    // Send Verification Email (Non-blocking)
    const userName = registerDto.profileData.firstName || user.email.split('@')[0];
    this.sendVerificationEmail(user.id, user.email, userName).catch(e => {
      this.logger.error(`Failed to send verification email to ${user.email}`, e.stack);
    });

    return result;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Always return success to prevent user enumeration
    if (!user) {
      this.logger.warn(`Forgot password requested for non-existing email: ${email}`);
      return { message: 'หากอีเมลนี้มีอยู่ในระบบ ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลของคุณ' };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    // Save token to user
    await this.usersService.updateResetToken(user.id, token, expires);

    // Build reset link
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    // Get user name for email
    const fullUser = await this.usersService.findOne(user.id);
    const userName = fullUser?.user_profile?.first_name || user.email.split('@')[0];

    // Send email
    try {
      const html = this.mailService.getResetPasswordTemplate(userName, resetLink);
      await this.mailService.sendMail(user.email, 'รีเซ็ตรหัสผ่าน Green Sync', html);
      this.logger.log(`Reset password email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${user.email}:`, error.message);
    }

    // Always log the link for development convenience
    this.logger.log(`🔗 Password reset link for ${user.email}: ${resetLink}`);

    return { message: 'หากอีเมลนี้มีอยู่ในระบบ ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลของคุณ' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('กรุณาระบุ Token และรหัสผ่านใหม่');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    // Check expiry
    if (user.reset_password_expires && user.reset_password_expires < new Date()) {
      throw new BadRequestException('ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่');
    }

    // Hash new password and clear token
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordAndClearToken(user.id, hashedPassword);

    this.logger.log(`Password reset successful for user: ${user.email}`);
    return { message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้' };
  }

  async sendVerificationEmail(userId: number, email: string, userName: string) {
    const token = await this.jwtService.signAsync(
      { sub: userId, email, purpose: 'email-verification' },
      { expiresIn: '1d' }
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const verifyLink = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = this.mailService.getVerificationEmailTemplate(userName, verifyLink);
    await this.mailService.sendMail(email, 'ยืนยันอีเมลสำหรับ Green Sync', html);
    
    this.logger.log(`🔗 Verification link for ${email}: ${verifyLink}`);
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('กรุณาระบุ Token สำหรับการยืนยันอีเมล');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.purpose !== 'email-verification') {
        throw new BadRequestException('Token ไม่ถูกต้องสำหรับวัตถุประสงค์นี้');
      }

      const userId = payload.sub;
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('ไม่พบผู้ใช้งานในระบบ');
      }

      if (user.email_verified_at) {
        return { success: true, message: 'อีเมลได้รับการยืนยันอยู่แล้ว' };
      }

      await this.usersService.verifyEmail(userId);

      this.logger.log(`Email verified successfully for user: ${user.email}`);
      return { success: true, message: 'ยืนยันอีเมลสำเร็จแล้ว คุณสามารถเข้าสู่ระบบและเริ่มใช้งานได้' };
    } catch (error) {
      this.logger.error('Email verification failed:', error.message);
      throw new BadRequestException('ลิงก์ยืนยันอีเมลหมดอายุหรือไม่ถูกต้อง');
    }
  }
}
