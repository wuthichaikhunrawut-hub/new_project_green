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
  create(
    @Body() createAssessmentDto: CreateAssessmentDto,
    @Headers() headers: any,
  ) {
    return this.assessmentsService.create(
      createAssessmentDto,
      this.getOrgId(headers),
    );
  }

  @Get('draft')
  getDraft(@Headers() headers: any) {
    const orgId = this.getOrgId(headers);
    return this.assessmentsService.getDraft(orgId);
  }

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findAll(@Headers() headers: any) {
    const role = this.getUserRole(headers);
    const assessorId = headers['x-user-id'];
    return this.assessmentsService.findAll(
      this.getOrgId(headers),
      role,
      assessorId,
    );
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number, @Headers() headers: any) {
    // Pass 0 as orgId for ASSESSOR/ADMIN to bypass org filter, otherwise enforce it
    const role = this.getUserRole(headers);
    const orgId =
      ['ASSESSOR', 'ASSESSOR_ADMIN', 'ADMIN', 'SYSTEM_ADMIN'].includes(role) ? 0 : this.getOrgId(headers);
    return this.assessmentsService.findOne(+id, orgId);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Headers() headers: any,
  ) {
    const role = this.getUserRole(headers);
    const orgId =
      ['ASSESSOR', 'ASSESSOR_ADMIN', 'ADMIN', 'SYSTEM_ADMIN'].includes(role) ? 0 : this.getOrgId(headers);
    return this.assessmentsService.update(+id, updateAssessmentDto, orgId);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @Headers() headers: any) {
    const role = this.getUserRole(headers);
    const orgId =
      ['ASSESSOR', 'ASSESSOR_ADMIN', 'ADMIN', 'SYSTEM_ADMIN'].includes(role) ? 0 : this.getOrgId(headers);
    return this.assessmentsService.remove(+id, orgId);
  }
}
