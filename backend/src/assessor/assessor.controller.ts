import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AssessorService } from './assessor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApproveAssessmentDto } from './dto/approve-assessment.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { SaveEvidenceReviewDto } from './dto/save-evidence-review.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  orgId?: number;
}

@Controller('assessor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
export class AssessorController {
  constructor(private readonly assessorService: AssessorService) {}

  private userId(req: { user: JwtUser }): number {
    return Number(req.user.sub);
  }

  @Get('dashboard')
  getDashboard(@Request() req: { user: JwtUser }) {
    return this.assessorService.getDashboard(this.userId(req));
  }

  @Get('assignments')
  getAssignments(@Request() req: { user: JwtUser }) {
    return this.assessorService.getAssignments(this.userId(req));
  }

  @Get('history')
  getHistory(@Request() req: { user: JwtUser }) {
    return this.assessorService.getHistory(this.userId(req));
  }

  @Get('organizations/:orgId/carbon-summary')
  getCarbonSummary(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.assessorService.getOrgCarbonSummary(orgId);
  }

  @Get('assessments/:id')
  getAssessment(@Param('id', ParseIntPipe) id: number) {
    return this.assessorService.getAssessmentDetail(id);
  }

  @Post('assessments/:id/evidence-review')
  saveEvidenceReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveEvidenceReviewDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.saveEvidenceReview(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveAssessmentDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.approveAssessment(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/certificate')
  updateCertificate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCertificateDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.updateCertificate(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/request-revision')
  requestRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestRevisionDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.requestRevision(id, this.userId(req), dto);
  }
}
