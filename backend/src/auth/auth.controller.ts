import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: any) {
    this.logger.log(`Register request for: ${registerDto.userData?.email}`);
    return this.authService.register(registerDto);
  }

  @Post('register/assessor')
  registerAssessor(@Body() registerAssessorDto: any) {
    this.logger.log(
      `Register Assessor request for: ${registerAssessorDto.userData?.email}`,
    );
    return this.authService.registerAssessor(registerAssessorDto);
  }

  @Post('login')
  login(@Body() loginDto: any) {
    this.logger.log(`Login request for: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }
}
