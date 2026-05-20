import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessmentDetail } from '../assessments/entities/assessment-detail.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { Certificate } from '../assessments/entities/certificate.entity';
import { ApproveAssessmentDto } from './dto/approve-assessment.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { SaveEvidenceReviewDto } from './dto/save-evidence-review.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  AssessorAssignmentItem,
  AssessorDashboardResponse,
  AssessorDashboardStats,
  OrgCarbonSummary,
  ScopeEmissionSummary,
} from './interfaces/assessor.types';

const SCOPE_LABELS: Record<number, string> = {
  1: 'Scope 1 — ก๊าซเรือนกระจกโดยตรง',
  2: 'Scope 2 — พลังงานที่ซื้อมา',
  3: 'Scope 3 — ก๊าซเรือนกระจกทางอ้อม',
};

const ACTIVE_STATUSES = ['PENDING', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED'];
const COMPLETED_STATUSES = ['APPROVED', 'REJECTED'];

@Injectable()
export class AssessorService {
  private readonly logger = new Logger(AssessorService.name);

  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(AssessmentDetail)
    private readonly detailRepo: Repository<AssessmentDetail>,
    @InjectRepository(CarbonLog)
    private readonly carbonLogRepo: Repository<CarbonLog>,
    @InjectRepository(Certificate)
    private readonly certificateRepo: Repository<Certificate>,
  ) {}

  async getDashboard(assessorUserId: number): Promise<AssessorDashboardResponse> {
    try {
      const assessments = await this.loadAssessmentsForAssessor(assessorUserId);
      const stats = this.buildStats(assessments);
      const assignments = await this.buildAssignments(assessments);
      return { stats, assignments };
    } catch (error) {
      this.logger.error('getDashboard failed', error);
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดแดชบอร์ดผู้ตรวจประเมินได้',
      );
    }
  }

  async getHistory(assessorUserId: number): Promise<AssessorAssignmentItem[]> {
    try {
      const assessments = await this.assessmentRepo.find({
        where: { status: In(COMPLETED_STATUSES) },
        relations: ['organization', 'certificates'],
        order: { updated_at: 'DESC' },
        take: 100,
      });
      return this.buildAssignments(assessments);
    } catch (error) {
      this.logger.error('getHistory failed', error);
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดประวัติการประเมินได้',
      );
    }
  }

  async getAssignments(assessorUserId: number): Promise<AssessorAssignmentItem[]> {
    try {
      const assessments = await this.loadAssessmentsForAssessor(assessorUserId);
      return this.buildAssignments(assessments);
    } catch (error) {
      this.logger.error('getAssignments failed', error);
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดรายการมอบหมายได้',
      );
    }
  }

  async getOrgCarbonSummary(orgId: number): Promise<OrgCarbonSummary> {
    try {
      return await this.computeCarbonSummary(orgId);
    } catch (error) {
      this.logger.error(`getOrgCarbonSummary failed for org ${orgId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถคำนวณข้อมูลคาร์บอนได้',
      );
    }
  }

  async getAssessmentDetail(assessmentId: number): Promise<Assessment> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: assessmentId },
        relations: [
          'organization',
          'assessor',
          'details',
          'details.criteria',
          'details.evidence_files',
        ],
      });
      if (!assessment) {
        throw new NotFoundException('ไม่พบคำขอประเมิน');
      }
      return assessment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`getAssessmentDetail failed id=${assessmentId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดรายละเอียดคำขอได้',
      );
    }
  }

  async saveEvidenceReview(
    assessmentId: number,
    assessorUserId: number,
    dto: SaveEvidenceReviewDto,
  ): Promise<Assessment> {
    try {
      if (!dto.details?.length) {
        throw new BadRequestException('ไม่มีรายการหลักฐานที่ต้องบันทึก');
      }

      const assessment = await this.getAssessmentDetail(assessmentId);
      await this.assignAssessorIfNeeded(assessment, assessorUserId);

      const detailsToSave: AssessmentDetail[] = [];
      for (const item of dto.details) {
        const detail = assessment.details?.find(
          (d) => d.id === item.assessment_detail_id,
        );
        if (!detail) continue;

        const maxScore = detail.criteria?.max_score ?? 5;
        const scoreFromResult =
          item.assessor_score !== undefined
            ? item.assessor_score
            : item.result === 'PASS'
              ? maxScore
              : 0;

        detail.assessor_score = scoreFromResult;
        detail.auditor_comment = item.auditor_comment ?? detail.auditor_comment;
        detailsToSave.push(detail);
      }

      if (detailsToSave.length > 0) {
        await this.detailRepo.save(detailsToSave);
      }

      assessment.status = 'IN_REVIEW';
      assessment.assessor_user_id = assessorUserId;
      await this.assessmentRepo.save(assessment);

      return this.getAssessmentDetail(assessmentId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`saveEvidenceReview failed id=${assessmentId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถบันทึกผลการตรวจหลักฐานได้',
      );
    }
  }

  async approveAssessment(
    assessmentId: number,
    assessorUserId: number,
    dto: ApproveAssessmentDto,
  ): Promise<Assessment> {
    try {
      const assessment = await this.getAssessmentDetail(assessmentId);

      if (COMPLETED_STATUSES.includes(assessment.status)) {
        throw new BadRequestException('คำขอนี้ปิดการประเมินแล้ว');
      }

      await this.assignAssessorIfNeeded(assessment, assessorUserId);

      if (dto.details?.length) {
        await this.applyDetailUpdates(assessment, dto.details);
      }

      const totalScore =
        dto.total_score !== undefined
          ? dto.total_score
          : this.calculateTotalScore(assessment);

      const certifiedLevel =
        dto.certified_level ?? this.resolveCertificationLevel(assessment);

      assessment.status = 'APPROVED';
      assessment.total_score = totalScore;
      assessment.certified_level = certifiedLevel;
      assessment.notes = dto.notes ?? assessment.notes;
      assessment.assessor_user_id = assessorUserId;
      if (!assessment.submitted_at) {
        assessment.submitted_at = new Date();
      }

      await this.assessmentRepo.save(assessment);

      if (dto.certificate_no || dto.certificate_url || dto.issued_at || dto.expired_at) {
        let cert = await this.certificateRepo.findOne({
          where: { assessment_id: assessmentId },
        });
        if (!cert) {
          cert = this.certificateRepo.create({
            assessment_id: assessmentId,
            org_id: assessment.org_id,
          });
        }
        cert.certificate_no = dto.certificate_no !== undefined ? dto.certificate_no : cert.certificate_no;
        cert.issued_at = dto.issued_at ? new Date(dto.issued_at) : (cert.issued_at || new Date());
        cert.expired_at = dto.expired_at ? new Date(dto.expired_at) : cert.expired_at;
        cert.certificate_url = dto.certificate_url !== undefined ? dto.certificate_url : cert.certificate_url;
        await this.certificateRepo.save(cert);
      }

      return this.getAssessmentDetail(assessmentId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`approveAssessment failed id=${assessmentId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถอนุมัติคำขอได้',
      );
    }
  }

  async updateCertificate(
    assessmentId: number,
    assessorUserId: number,
    dto: UpdateCertificateDto,
  ): Promise<Assessment> {
    try {
      const assessment = await this.getAssessmentDetail(assessmentId);
      await this.assignAssessorIfNeeded(assessment, assessorUserId);

      let cert = await this.certificateRepo.findOne({
        where: { assessment_id: assessmentId },
      });
      if (!cert) {
        cert = this.certificateRepo.create({
          assessment_id: assessmentId,
          org_id: assessment.org_id,
        });
      }
      cert.certificate_no = dto.certificate_no !== undefined ? dto.certificate_no : cert.certificate_no;
      cert.issued_at = dto.issued_at ? new Date(dto.issued_at) : (cert.issued_at || new Date());
      cert.expired_at = dto.expired_at ? new Date(dto.expired_at) : cert.expired_at;
      cert.certificate_url = dto.certificate_url !== undefined ? dto.certificate_url : cert.certificate_url;
      await this.certificateRepo.save(cert);

      return this.getAssessmentDetail(assessmentId);
    } catch (error) {
      this.logger.error(`updateCertificate failed id=${assessmentId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถบันทึกข้อมูลใบรับรองได้',
      );
    }
  }

  async requestRevision(
    assessmentId: number,
    assessorUserId: number,
    dto: RequestRevisionDto,
  ): Promise<Assessment> {
    try {
      if (!dto.notes?.trim()) {
        throw new BadRequestException('กรุณาระบุเหตุผลในการส่งกลับแก้ไข');
      }

      const assessment = await this.getAssessmentDetail(assessmentId);

      if (COMPLETED_STATUSES.includes(assessment.status)) {
        throw new BadRequestException('คำขอนี้ปิดการประเมินแล้ว');
      }

      await this.assignAssessorIfNeeded(assessment, assessorUserId);

      if (dto.details?.length) {
        await this.applyDetailUpdates(
          assessment,
          dto.details.map((d) => ({
            assessment_detail_id: d.assessment_detail_id,
            assessor_score: undefined as unknown as number,
            auditor_comment: d.auditor_comment,
          })),
        );
      }

      assessment.status = 'REVISION_REQUESTED';
      assessment.notes = dto.notes;
      assessment.assessor_user_id = assessorUserId;

      await this.assessmentRepo.save(assessment);
      return this.getAssessmentDetail(assessmentId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`requestRevision failed id=${assessmentId}`, error);
      throw new InternalServerErrorException(
        'ไม่สามารถส่งกลับแก้ไขได้',
      );
    }
  }

  private async loadAssessmentsForAssessor(
    assessorUserId: number,
  ): Promise<Assessment[]> {
    const assigned = await this.assessmentRepo.find({
      where: {
        assessor_user_id: assessorUserId,
        status: In(ACTIVE_STATUSES),
      },
      relations: ['organization', 'certificates'],
      order: { created_at: 'DESC' },
    });

    const unassigned = await this.assessmentRepo.find({
      where: { status: In(['PENDING', 'SUBMITTED', 'IN_REVIEW']) },
      relations: ['organization', 'certificates'],
      order: { created_at: 'DESC' },
    });

    const map = new Map<number, Assessment>();
    [...unassigned, ...assigned].forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }

  private buildStats(assessments: Assessment[]): AssessorDashboardStats {
    const all = assessments;
    const pending = all.filter((a) =>
      ['PENDING', 'SUBMITTED'].includes(a.status),
    ).length;
    const inReview = all.filter((a) => a.status === 'IN_REVIEW').length;
    const revisionRequested = all.filter(
      (a) => a.status === 'REVISION_REQUESTED',
    ).length;

    return {
      pending,
      inReview,
      revisionRequested,
      completed: 0,
      nearDeadline: this.countNearDeadline(all),
      avgScorePercent: this.avgScorePercent(all),
    };
  }

  private async buildAssignments(
    assessments: Assessment[],
  ): Promise<AssessorAssignmentItem[]> {
    const items: AssessorAssignmentItem[] = [];
    for (const a of assessments) {
      const orgId = a.org_id ?? a.organization?.id;
      if (!orgId) continue;
      const carbonSummary = await this.computeCarbonSummary(
        orgId,
        a.organization?.name,
      );
      items.push({
        id: a.id,
        orgId,
        orgName: a.organization?.name ?? `องค์กร #${orgId}`,
        assessmentYear: a.assessment_year ?? new Date().getFullYear(),
        status: a.status,
        totalScore: Number(a.total_score ?? 0),
        submittedAt: a.submitted_at
          ? new Date(a.submitted_at).toISOString()
          : null,
        carbonSummary,
        hasCertificate: a.certificates && a.certificates.some(c => c.certificate_url || c.certificate_no),
      });
    }
    return items;
  }

  private async computeCarbonSummary(
    orgId: number,
    orgName?: string,
  ): Promise<OrgCarbonSummary> {
    const rows = await this.carbonLogRepo
      .createQueryBuilder('log')
      .leftJoin('log.emission_factor', 'factor')
      .where('log.org_id = :orgId', { orgId })
      .select('factor.scope', 'scope')
      .addSelect('COUNT(log.carbon_log_id)', 'logCount')
      .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
      .groupBy('factor.scope')
      .getRawMany<{ scope: string; logCount: string; totalEmission: string }>();

    const scopeMap = new Map<number, ScopeEmissionSummary>();
    for (const scopeNum of [1, 2, 3]) {
      scopeMap.set(scopeNum, {
        scope: scopeNum,
        label: SCOPE_LABELS[scopeNum],
        totalEmission: 0,
        logCount: 0,
      });
    }

    let hasRealData = false;
    for (const row of rows) {
      const scope = Number(row.scope);
      if (!scope || !scopeMap.has(scope)) continue;
      const total = Number(row.totalEmission) || 0;
      if (total > 0) hasRealData = true;
      scopeMap.set(scope, {
        scope,
        label: SCOPE_LABELS[scope],
        totalEmission: total,
        logCount: Number(row.logCount) || 0,
      });
    }

    const scopes = Array.from(scopeMap.values());
    const totalEmission = scopes.reduce((s, x) => s + x.totalEmission, 0);

    if (!hasRealData && totalEmission === 0) {
      return this.mockCarbonSummary(orgId, orgName);
    }

    return {
      orgId,
      orgName: orgName ?? `องค์กร #${orgId}`,
      scopes,
      totalEmission,
      isMock: false,
    };
  }

  private mockCarbonSummary(orgId: number, orgName?: string): OrgCarbonSummary {
    const scopes: ScopeEmissionSummary[] = [
      {
        scope: 1,
        label: SCOPE_LABELS[1],
        totalEmission: 12.4,
        logCount: 8,
      },
      {
        scope: 2,
        label: SCOPE_LABELS[2],
        totalEmission: 45.8,
        logCount: 12,
      },
      {
        scope: 3,
        label: SCOPE_LABELS[3],
        totalEmission: 6.2,
        logCount: 5,
      },
    ];
    return {
      orgId,
      orgName: orgName ?? `องค์กร #${orgId}`,
      scopes,
      totalEmission: scopes.reduce((s, x) => s + x.totalEmission, 0),
      isMock: true,
    };
  }

  private countNearDeadline(assessments: Assessment[]): number {
    const threshold = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return assessments.filter((a) => {
      if (!ACTIVE_STATUSES.includes(a.status)) return false;
      const created = new Date(a.created_at).getTime();
      return created < threshold;
    }).length;
  }

  private avgScorePercent(assessments: Assessment[]): number {
    const scored = assessments.filter((a) => Number(a.total_score) > 0);
    if (!scored.length) return 0;
    const sum = scored.reduce((s, a) => s + Number(a.total_score), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  }

  private async assignAssessorIfNeeded(
    assessment: Assessment,
    assessorUserId: number,
  ): Promise<void> {
    if (!assessment.assessor_user_id) {
      assessment.assessor_user_id = assessorUserId;
      await this.assessmentRepo.save(assessment);
    }
  }

  private async applyDetailUpdates(
    assessment: Assessment,
    details: {
      assessment_detail_id: number;
      assessor_score?: number;
      auditor_comment?: string;
    }[],
  ): Promise<void> {
    const toSave: AssessmentDetail[] = [];
    for (const item of details) {
      const detail = assessment.details?.find(
        (d) => d.id === item.assessment_detail_id,
      );
      if (!detail) continue;
      if (item.assessor_score !== undefined) {
        detail.assessor_score = item.assessor_score;
      }
      if (item.auditor_comment !== undefined) {
        detail.auditor_comment = item.auditor_comment;
      }
      toSave.push(detail);
    }
    if (toSave.length) {
      await this.detailRepo.save(toSave);
    }
  }

  private calculateTotalScore(assessment: Assessment): number {
    if (!assessment.details?.length) return 0;
    return assessment.details.reduce(
      (sum, d) => sum + Number(d.assessor_score ?? 0),
      0,
    );
  }

  private resolveCertificationLevel(assessment: Assessment): string {
    const max = assessment.details?.reduce(
      (s, d) => s + Number(d.criteria?.max_score ?? 5),
      0,
    ) ?? 0;
    const total = this.calculateTotalScore(assessment);
    const percent = max > 0 ? (total / max) * 100 : 0;
    if (percent >= 90) return 'ระดับ ทอง (Gold)';
    if (percent >= 70) return 'ระดับ เงิน (Silver)';
    if (percent >= 50) return 'ระดับ ทองแดง (Bronze)';
    return 'ไม่ผ่านการรับรอง';
  }
}
