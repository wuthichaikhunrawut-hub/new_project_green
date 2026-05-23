import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Controller('assessments')
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
  findOne(@Param('id') id: string, @Headers() headers: any) {
    // Pass 0 as orgId for ASSESSOR/ADMIN to bypass org filter, otherwise enforce it
    const role = this.getUserRole(headers);
    const orgId =
      role === 'ASSESSOR' || role === 'ADMIN' ? 0 : this.getOrgId(headers);
    return this.assessmentsService.findOne(+id, orgId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Headers() headers: any,
  ) {
    const role = this.getUserRole(headers);
    const orgId =
      role === 'ASSESSOR' || role === 'ADMIN' ? 0 : this.getOrgId(headers);
    return this.assessmentsService.update(+id, updateAssessmentDto, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() headers: any) {
    const role = this.getUserRole(headers);
    const orgId =
      role === 'ASSESSOR' || role === 'ADMIN' ? 0 : this.getOrgId(headers);
    return this.assessmentsService.remove(+id, orgId);
  }
}
