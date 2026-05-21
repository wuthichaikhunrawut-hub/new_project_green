import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { Organization } from '../organizations/entities/organization.entity';
import {
  CarbonScopePoint,
  CarbonUnitPoint,
  ExecutiveDashboardResponse,
} from './interfaces/executive.types';

@Injectable()
export class ExecutiveService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(CarbonLog)
    private readonly carbonRepo: Repository<CarbonLog>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async getDashboard(orgId: number): Promise<ExecutiveDashboardResponse> {
    try {
      const organization = await this.orgRepo.findOne({ where: { id: orgId } });
      if (!organization) {
        throw new NotFoundException('ไม่พบข้อมูลองค์กร');
      }

      const approvedAssessments = await this.assessmentRepo.find({
        where: { org_id: orgId, status: 'APPROVED' },
        relations: ['certificates'],
        order: { updated_at: 'DESC' },
      });

      const carbonByScope = await this.getCarbonByScope(orgId);
      const carbonByUnit = await this.getCarbonByUnit(orgId);
      const approvedCount = approvedAssessments.length;
      const avgApprovedScore =
        approvedCount > 0
          ? Number(
              (
                approvedAssessments.reduce(
                  (sum, item) => sum + Number(item.total_score || 0),
                  0,
                ) / approvedCount
              ).toFixed(2),
            )
          : 0;

      const latestCertifiedLevel =
        approvedAssessments.find((item) => item.certified_level)?.certified_level ??
        null;

      const netZeroProgressPercent = this.calculateNetZeroProgressPercent(
        organization.base_year ?? new Date().getFullYear(),
        organization.target_reduction_percent ?? 0,
        carbonByScope,
      );

      return {
        orgId: organization.id,
        orgName: organization.name,
        targetReductionPercent: organization.target_reduction_percent ?? 0,
        approvedCount,
        avgApprovedScore,
        latestCertifiedLevel,
        netZeroProgressPercent,
        approvedAssessments: approvedAssessments.map((item) => ({
          id: item.id,
          assessmentYear: item.assessment_year ?? null,
          totalScore: Number(item.total_score || 0),
          certifiedLevel: item.certified_level ?? null,
          approvedAt: item.updated_at ? item.updated_at.toISOString() : null,
          certificateUrl: item.certificates && item.certificates.length > 0 ? item.certificates[0].certificate_url : null,
          certificateNo: item.certificates && item.certificates.length > 0 ? item.certificates[0].certificate_no : null,
          issuedAt: item.certificates && item.certificates.length > 0 && item.certificates[0].issued_at ? item.certificates[0].issued_at.toISOString() : null,
          expiredAt: item.certificates && item.certificates.length > 0 && item.certificates[0].expired_at ? item.certificates[0].expired_at.toISOString() : null,
        })),
        carbonByScope,
        carbonByUnit,
      };
    } catch (error) {
      console.error('getDashboard error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดแดชบอร์ดผู้บริหารได้',
      );
    }
  }

  private async getCarbonByScope(orgId: number): Promise<CarbonScopePoint[]> {
    const rows = await this.carbonRepo
      .createQueryBuilder('log')
      .leftJoin('log.emission_factor', 'factor')
      .where('log.org_id = :orgId', { orgId })
      .andWhere('factor.scope IN (:...scopes)', { scopes: [1, 2, 3] })
      .select('factor.scope', 'scope')
      .addSelect('log.year', 'year')
      .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
      .groupBy('factor.scope')
      .addGroupBy('log.year')
      .orderBy('log.year', 'ASC')
      .addOrderBy('factor.scope', 'ASC')
      .getRawMany<{ scope: string; year: string; totalEmission: string }>();

    return rows.map((row) => ({
      scope: Number(row.scope),
      year: Number(row.year),
      totalEmission: Number(row.totalEmission),
    }));
  }

  private async getCarbonByUnit(orgId: number): Promise<CarbonUnitPoint[]> {
    const rows = await this.carbonRepo
      .createQueryBuilder('log')
      .leftJoin('log.organization_unit', 'unit')
      .where('log.org_id = :orgId', { orgId })
      .select('unit.unit_name', 'unitName')
      .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
      .groupBy('unit.unit_name')
      .orderBy('SUM(log.total_emission)', 'DESC')
      .getRawMany<{ unitName: string | null; totalEmission: string }>();

    return rows.map((row) => ({
      unitName: row.unitName || 'ไม่ระบุสาขา',
      totalEmission: Number(row.totalEmission),
    }));
  }

  private calculateNetZeroProgressPercent(
    baseYear: number,
    targetReductionPercent: number,
    points: CarbonScopePoint[],
  ): number {
    if (points.length === 0 || targetReductionPercent <= 0) {
      return 0;
    }

    const byYear = new Map<number, number>();
    for (const point of points) {
      byYear.set(
        point.year,
        (byYear.get(point.year) ?? 0) + Number(point.totalEmission || 0),
      );
    }

    const baseline = byYear.get(baseYear);
    const latestYear = Math.max(...Array.from(byYear.keys()));
    const latest = byYear.get(latestYear);
    if (!baseline || !latest || baseline <= 0) {
      return 0;
    }

    const actualReductionPercent = ((baseline - latest) / baseline) * 100;
    const progress = (actualReductionPercent / targetReductionPercent) * 100;
    return Number(Math.max(0, Math.min(100, progress)).toFixed(2));
  }
}
