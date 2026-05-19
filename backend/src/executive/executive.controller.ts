import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExecutiveService } from './executive.service';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  orgId?: number;
}

@Controller('executive')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EXECUTIVE', 'SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN')
export class ExecutiveController {
  constructor(private readonly executiveService: ExecutiveService) {}

  @Get('dashboard')
  getDashboard(@Request() req: { user: JwtUser }) {
    return this.executiveService.getDashboard(Number(req.user.orgId ?? 0));
  }
}
