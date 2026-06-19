import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from '../users/users.service';

import { AssessorAdminService } from './assessor-admin.service';

@Controller('assessor-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessorAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assessorAdminService: AssessorAdminService,
  ) {}

  @Get('dashboard')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  getDashboard() {
    return this.assessorAdminService.getDashboardStats();
  }

  @Get('assessors')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  findAllAssessors() {
    return this.usersService.findAll('ASSESSOR');
  }

  @Get('assessors/:id')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  findOneAssessor(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch('assessors/:id/status')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  updateAssessorStatus(
    @Param('id') id: string,
    @Body() updateData: { is_active: boolean },
  ) {
    return this.usersService.update(+id, { is_active: updateData.is_active });
  }

  @Delete('assessors/:id')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  removeAssessor(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('assignments')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  assignAssessor(@Body() body: { assessmentId: number; assessorId: number }) {
    return this.assessorAdminService.assignAssessor(
      body.assessmentId,
      body.assessorId,
    );
  }

  @Get('performance/:assessorId')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  getPerformance(@Param('assessorId') assessorId: string) {
    return this.assessorAdminService.getAssessorPerformance(+assessorId);
  }

  @Post('payouts')
  @Roles('SYSTEM_ADMIN', 'ASSESSOR_ADMIN')
  processPayout(@Body() body: { assessorId: number; amount: number }) {
    return this.assessorAdminService.processPayout(
      body.assessorId,
      body.amount,
    );
  }
}
