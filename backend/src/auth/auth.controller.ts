import { Controller, Post, Body, Logger, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegisterDto,
  LoginDto,
  RegisterAssessorDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'ลงทะเบียนสมาชิกองค์กรใหม่ (สมัครใช้บริการ)' })
  @ApiResponse({ status: 201, description: 'ลงทะเบียนและสร้างหน่วยงานสำเร็จ' })
  register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Register request for: ${registerDto.userData?.email}`);
    return this.authService.register(registerDto);
  }

  @Post('register/assessor')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'สมัครสมาชิกในฐานะผู้ประเมิน Green Office (Assessor)',
  })
  @ApiResponse({
    status: 201,
    description: 'ลงทะเบียนผู้ประเมินสำเร็จ รอการอนุมัติสิทธิ์',
  })
  registerAssessor(@Body() registerAssessorDto: RegisterAssessorDto) {
    this.logger.log(
      `Register Assessor request for: ${registerAssessorDto.userData?.email}`,
    );
    return this.authService.registerAssessor(registerAssessorDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'เข้าสู่ระบบ (ล็อกอิน)' })
  @ApiResponse({
    status: 200,
    description: 'เข้าสู่ระบบสำเร็จ ส่งคืน JWT Access Token',
  })
  login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login request for: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'ร้องขอการรีเซ็ตรหัสผ่าน (ส่งลิงก์ผ่านอีเมล)' })
  @ApiResponse({ status: 200, description: 'ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อย' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    this.logger.log(`Forgot password request for: ${body.email}`);
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'ตั้งค่ารหัสผ่านใหม่ด้วยโทเค็น' })
  @ApiResponse({ status: 200, description: 'เปลี่ยนรหัสผ่านใหม่สำเร็จ' })
  resetPassword(@Body() body: ResetPasswordDto) {
    this.logger.log('Reset password request received');
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'ยืนยันความถูกต้องของที่อยู่อีเมลผ่านลิงก์' })
  @ApiResponse({ status: 200, description: 'ยืนยันอีเมลสำเร็จ' })
  verifyEmail(@Query('token') token: string) {
    this.logger.log('Verify email request received');
    return this.authService.verifyEmail(token);
  }
}
