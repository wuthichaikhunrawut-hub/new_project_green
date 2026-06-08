import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Request,
  Query,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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
  getDashboard(
    @Request() req: { user: JwtUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: number,
  ) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) {
      throw new BadRequestException('บัญชีนี้ไม่ได้เชื่อมกับองค์กร');
    }
    return this.executiveService.getDashboard(orgId, { startDate, endDate, branchId });
  }

  @Get('export/pdf')
  exportDashboardPdf(@Request() req: { user: JwtUser }, @Res() res: Response) {
    const orgId = Number(req.user.orgId ?? 0);
    // Real implementation would generate PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="executive_report.pdf"');
    res.send('Mock PDF Content for Executive Report');
  }

  @Post('goals')
  setGoal(@Request() req: { user: JwtUser }, @Body() body: { targetReductionPercent: number; year: number }) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) throw new BadRequestException('Organization ID missing');
    return this.executiveService.setGoal(orgId, body.targetReductionPercent, body.year);
  }
}
