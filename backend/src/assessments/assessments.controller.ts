import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  private getOrgId(headers: any): number {
    const orgIdStr = headers['x-org-id'];
    if (!orgIdStr) return 0;
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) return 0;
    return orgId;
  }

  private normalizeRole(role: string): string {
    return String(role || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  private getUserRole(headers: Record<string, string | undefined>): string {
    return this.normalizeRole(headers['x-user-role'] ?? '');
  }

  @Post()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  create(@Body() createAssessmentDto: CreateAssessmentDto, @Req() req: any) {
    const role = req.user.role;
    const orgId =
      role === 'SYSTEM_ADMIN'
        ? req.headers['x-org-id']
          ? parseInt(req.headers['x-org-id'], 10)
          : 0
        : req.user.orgId;
    return this.assessmentsService.create(createAssessmentDto, orgId);
  }

  @Get('draft')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  getDraft(@Req() req: any) {
    const orgId = req.user.orgId;
    return this.assessmentsService.getDraft(orgId);
  }

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findAll(@Req() req: any) {
    const role = req.user.role;
    let orgId = req.user.orgId;
    if (
      role === 'SYSTEM_ADMIN' ||
      role === 'ASSESSOR' ||
      role === 'ASSESSOR_ADMIN'
    ) {
      const headerOrgId = req.headers['x-org-id'];
      orgId = headerOrgId ? parseInt(headerOrgId, 10) : 0;
    }
    const assessorId = role === 'ASSESSOR' ? req.user.sub : undefined;
    return this.assessmentsService.findAll(orgId, role, assessorId);
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const role = req.user.role;
    const orgId = [
      'ASSESSOR',
      'ASSESSOR_ADMIN',
      'ADMIN',
      'SYSTEM_ADMIN',
    ].includes(role)
      ? 0
      : req.user.orgId;
    return this.assessmentsService.findOne(+id, orgId);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Req() req: any,
  ) {
    const role = req.user.role;
    const orgId = [
      'ASSESSOR',
      'ASSESSOR_ADMIN',
      'ADMIN',
      'SYSTEM_ADMIN',
    ].includes(role)
      ? 0
      : req.user.orgId;
    return this.assessmentsService.update(+id, updateAssessmentDto, orgId);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const role = req.user.role;
    const orgId = [
      'ASSESSOR',
      'ASSESSOR_ADMIN',
      'ADMIN',
      'SYSTEM_ADMIN',
    ].includes(role)
      ? 0
      : req.user.orgId;
    return this.assessmentsService.remove(+id, orgId);
  }
}
