import { Controller, Post, Body, Logger, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterAssessorDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Register request for: ${registerDto.userData?.email}`);
    return this.authService.register(registerDto);
  }

  @Post('register/assessor')
  registerAssessor(@Body() registerAssessorDto: RegisterAssessorDto) {
    this.logger.log(
      `Register Assessor request for: ${registerAssessorDto.userData?.email}`,
    );
    return this.authService.registerAssessor(registerAssessorDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login request for: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    this.logger.log(`Forgot password request for: ${body.email}`);
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    this.logger.log('Reset password request received');
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    this.logger.log('Verify email request received');
    return this.authService.verifyEmail(token);
  }
}
