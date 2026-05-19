import {
  BadRequestException,
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) {
      throw new BadRequestException('บัญชีนี้ไม่ได้เชื่อมกับองค์กร');
    }
    return this.executiveService.getDashboard(orgId);
  }
}
