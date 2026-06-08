import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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
export class AssessorController {
  constructor(private readonly assessorService: AssessorService) {}

  private userId(req: { user: JwtUser }): number {
    return Number(req.user.sub);
  }

  @Get('dashboard')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  getDashboard(@Request() req: { user: JwtUser }) {
    return this.assessorService.getDashboard(this.userId(req));
  }

  @Get('assignments')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  getAssignments(@Request() req: { user: JwtUser }) {
    return this.assessorService.getAssignments(this.userId(req));
  }

  @Get('history')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  getHistory(@Request() req: { user: JwtUser }) {
    return this.assessorService.getHistory(this.userId(req));
  }

  @Get('payouts')
  @Roles('ASSESSOR')
  getPayouts(@Request() req: { user: JwtUser }) {
    return this.assessorService.getPayouts(this.userId(req));
  }

  @Get('calendar')
  @Roles('ASSESSOR')
  getCalendar(@Request() req: { user: JwtUser }) {
    return this.assessorService.getCalendar(this.userId(req));
  }

  @Get('certificates/:id/pdf')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN', 'ORG_ADMIN')
  async getCertificatePdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.assessorService.generateCertificatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate_${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('organizations/:orgId/carbon-summary')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'EXECUTIVE', 'EMPLOYEE', 'USER')
  getCarbonSummary(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.assessorService.getOrgCarbonSummary(orgId);
  }

  @Get('assessments/:id')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'EXECUTIVE', 'EMPLOYEE', 'USER')
  getAssessment(@Param('id', ParseIntPipe) id: number) {
    return this.assessorService.getAssessmentDetail(id);
  }

  @Post('assessments/:id/evidence-review')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  saveEvidenceReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveEvidenceReviewDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.saveEvidenceReview(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/approve')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveAssessmentDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.approveAssessment(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/certificate')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  updateCertificate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCertificateDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.updateCertificate(id, this.userId(req), dto);
  }

  @Patch('assessments/:id/request-revision')
  @Roles('ASSESSOR', 'SYSTEM_ADMIN', 'ADMIN')
  requestRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestRevisionDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.assessorService.requestRevision(id, this.userId(req), dto);
  }
}
