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
import { SettingsService } from '../settings/settings.service';
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
    private readonly settingsService: SettingsService,
  ) {}

  async getDashboard(orgId: number, filters?: { startDate?: string; endDate?: string; branchId?: number }): Promise<ExecutiveDashboardResponse> {
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

      const carbonByScope = await this.getCarbonByScope(orgId, filters);
      const carbonByUnit = await this.getCarbonByUnit(orgId, filters);
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
        approvedAssessments.find((item) => item.certified_level)
          ?.certified_level ?? null;

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
          certificateUrl:
            item.certificates && item.certificates.length > 0
              ? item.certificates[0].certificate_url
              : null,
          certificateNo:
            item.certificates && item.certificates.length > 0
              ? item.certificates[0].certificate_no
              : null,
          issuedAt:
            item.certificates &&
            item.certificates.length > 0 &&
            item.certificates[0].issued_at
              ? item.certificates[0].issued_at.toISOString()
              : null,
          expiredAt:
            item.certificates &&
            item.certificates.length > 0 &&
            item.certificates[0].expired_at
              ? item.certificates[0].expired_at.toISOString()
              : null,
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

  private async getCarbonByScope(orgId: number, filters?: { startDate?: string; endDate?: string; branchId?: number }): Promise<CarbonScopePoint[]> {
    const query = this.carbonRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.emission_factor', 'emission_factor')
      .where('log.org_id = :orgId', { orgId });

    if (filters?.startDate) {
      query.andWhere('log.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('log.date <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.branchId) {
      query.andWhere('log.organization_unit_id = :branchId', { branchId: filters.branchId });
    }

    const logs = await query.getMany();

    const scopeSums = new Map<string, number>(); // key: "scope-year"
    for (const log of logs) {
      let scope = log.emission_factor?.scope;
      if (!scope && log.activity_type) {
        const type = log.activity_type.toLowerCase();
        if (type.includes('electricity') || type.includes('ไฟ')) {
          scope = 2;
        } else if (type.includes('water') || type.includes('น้ำ') || type.includes('ขยะ') || type.includes('กระดาษ')) {
          scope = 3;
        } else {
          scope = 1;
        }
      }
      if (!scope) scope = 1;

      const year = log.year ?? new Date().getFullYear();
      const key = `${scope}-${year}`;
      scopeSums.set(key, (scopeSums.get(key) ?? 0) + Number(log.total_emission || 0));
    }

    const points: CarbonScopePoint[] = [];
    scopeSums.forEach((totalEmission, key) => {
      const [scope, year] = key.split('-').map(Number);
      points.push({ scope, year, totalEmission });
    });

    return points.sort((a, b) => a.year - b.year || a.scope - b.scope);
  }

  private async getCarbonByUnit(orgId: number, filters?: { startDate?: string; endDate?: string; branchId?: number }): Promise<CarbonUnitPoint[]> {
    const query = this.carbonRepo
      .createQueryBuilder('log')
      .leftJoin('log.organization_unit', 'unit')
      .where('log.org_id = :orgId', { orgId });

    if (filters?.startDate) {
      query.andWhere('log.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('log.date <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.branchId) {
      query.andWhere('log.organization_unit_id = :branchId', { branchId: filters.branchId });
    }

    const rows = await query
      .select('unit.unit_name', 'unitName')
      .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
      .groupBy('unit.unit_name')
      .orderBy('SUM(log.total_emission)', 'ASC')
      .getRawMany<{ unitName: string | null; totalEmission: string }>();

    // 1. Dynamic Industry Average from Settings
    const dbAverage = await this.settingsService.getSetting('industry_benchmark');
    const industryAverage = typeof dbAverage === 'number' ? dbAverage : 12000;

    // 2. Dynamic Percentile Calculation based on all branches in system
    const allBranchesEmissions = await this.carbonRepo.createQueryBuilder('log')
      .select('log.organization_unit_id', 'branchId')
      .addSelect('SUM(log.total_emission)', 'totalEmission')
      .groupBy('log.organization_unit_id')
      .getRawMany<{ branchId: number; totalEmission: string }>();

    const allEmissionsList = allBranchesEmissions
      .map(b => Number(b.totalEmission || 0))
      .sort((a, b) => a - b);

    return rows.map((row) => {
      const emission = Number(row.totalEmission);
      
      let percentile = 100;
      if (allEmissionsList.length > 1) {
        const countHigher = allEmissionsList.filter(val => val > emission).length;
        percentile = Math.max(1, Math.round((countHigher / (allEmissionsList.length - 1)) * 100));
      }

      return {
        unitName: row.unitName || 'หน่วยงานกลาง',
        totalEmission: emission,
        industryAverage,
        percentile,
      };
    });
  }

  async setGoal(orgId: number, targetReductionPercent: number, year: number) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    org.target_reduction_percent = targetReductionPercent;
    // Assuming base_year might be updated or a separate goals table exists. 
    // Here we update the organization's current target.
    await this.orgRepo.save(org);

    return { success: true, targetReductionPercent, year };
  }

  async getLeaderboard(orgId: number, year?: number): Promise<{
    rank: number;
    unitName: string;
    totalEmission: number;
    reductionPercent: number;
    badge: string;
    assessmentScore: number;
  }[]> {
    try {
      const targetYear = year ?? new Date().getFullYear();
      const prevYear = targetYear - 1;

      // Query current year carbon by unit
      const currentRows = await this.carbonRepo
        .createQueryBuilder('log')
        .leftJoin('log.organization_unit', 'unit')
        .where('log.org_id = :orgId', { orgId })
        .andWhere('log.year = :year', { year: targetYear })
        .select('COALESCE(unit.unit_name, :fallback)', 'unitName')
        .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
        .setParameter('fallback', 'หน่วยงานกลาง')
        .groupBy('unit.unit_name')
        .getRawMany<{ unitName: string; totalEmission: string }>();

      // Query previous year carbon by unit (for reduction calculation)
      const prevRows = await this.carbonRepo
        .createQueryBuilder('log')
        .leftJoin('log.organization_unit', 'unit')
        .where('log.org_id = :orgId', { orgId })
        .andWhere('log.year = :year', { year: prevYear })
        .select('COALESCE(unit.unit_name, :fallback)', 'unitName')
        .addSelect('COALESCE(SUM(log.total_emission), 0)', 'totalEmission')
        .setParameter('fallback', 'หน่วยงานกลาง')
        .groupBy('unit.unit_name')
        .getRawMany<{ unitName: string; totalEmission: string }>();

      // Build prev year map
      const prevMap = new Map<string, number>();
      prevRows.forEach(r => prevMap.set(r.unitName, Number(r.totalEmission)));

      // Combine + calculate reduction
      const items = currentRows.map(row => {
        const current = Number(row.totalEmission);
        const prev = prevMap.get(row.unitName) ?? 0;
        const reductionPercent = prev > 0
          ? Number((((prev - current) / prev) * 100).toFixed(2))
          : 0;
        return { unitName: row.unitName, totalEmission: current, reductionPercent };
      });

      // Sort by reductionPercent DESC, then by totalEmission ASC
      items.sort((a, b) => b.reductionPercent - a.reductionPercent || a.totalEmission - b.totalEmission);

      // Assign badge based on rank
      const getBadge = (rank: number, reductionPercent: number): string => {
        if (rank === 1 || reductionPercent >= 20) return '🥇 ทองคำ';
        if (rank <= 3 || reductionPercent >= 10) return '🥈 เงิน';
        if (rank <= 5 || reductionPercent >= 5) return '🥉 ทองแดง';
        return '🌱 มุ่งมั่น';
      };

      return items.map((item, index) => ({
        rank: index + 1,
        unitName: item.unitName,
        totalEmission: item.totalEmission,
        reductionPercent: item.reductionPercent,
        badge: getBadge(index + 1, item.reductionPercent),
        assessmentScore: 0, // assessment score ไม่ได้แยกตาม unit ในปัจจุบัน
      }));
    } catch (error) {
      console.error('getLeaderboard error:', error);
      throw new InternalServerErrorException('ไม่สามารถโหลดข้อมูล Leaderboard ได้');
    }
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
