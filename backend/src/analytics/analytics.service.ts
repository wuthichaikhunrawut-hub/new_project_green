import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invoice } from '../subscriptions/entities/invoice.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { OrganizationSubscription } from '../subscriptions/entities/organization-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import {
  AssessorProfile,
  VerificationStatus,
} from '../users/entities/assessor-profile.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    @InjectRepository(OrganizationSubscription)
    private orgSubRepo: Repository<OrganizationSubscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(AssessorProfile)
    private assessorRepo: Repository<AssessorProfile>,
    @InjectRepository(CarbonLog)
    private carbonLogRepo: Repository<CarbonLog>,
    @InjectRepository(EvidenceFile)
    private evidenceFileRepo: Repository<EvidenceFile>,
  ) {}

  async getAdminStats() {
    const totalOrganizations = await this.orgRepo.count();
    const activeOrganizations = await this.orgRepo.count({
      where: { is_active: true },
    });
    const totalUsers = await this.userRepo.count();

    // Assessor Stats (From AssessorProfile)
    const verifiedAssessors = await this.assessorRepo.count({
      where: { verification_status: VerificationStatus.VERIFIED },
    });
    const pendingAssessors = await this.assessorRepo.count({
      where: { verification_status: VerificationStatus.PENDING },
    });
    const totalAssessors = verifiedAssessors + pendingAssessors;

    // Revenue Stats (Total)
    const revenueSum = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.status = :status', { status: 'PAID' })
      .select('SUM(inv.amount)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const subscriptionRevenue = Number(revenueSum?.sum || 0);

    // Revenue this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRevenueSum = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.status = :status', { status: 'PAID' })
      .andWhere('inv.created_at >= :date', { date: thirtyDaysAgo })
      .select('SUM(inv.amount)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const revenueMonth = Number(recentRevenueSum?.sum || 0);

    // Plan Distribution
    const activeSubs = await this.orgSubRepo.find({ relations: ['plan'] });
    const planCounts: Record<string, number> = {};
    activeSubs.forEach((sub) => {
      const name = sub.plan?.plan_name || 'Free';
      planCounts[name] = (planCounts[name] || 0) + 1;
    });
    const planDistribution = Object.entries(planCounts).map(
      ([name, count]) => ({ name, count }),
    );

    // Assessment Stats
    const assessmentRequests = await this.assessmentRepo.count();
    const approvedAssessments = await this.assessmentRepo.count({
      where: { status: 'APPROVED' },
    });
    const pendingAssessments = await this.assessmentRepo.count({
      where: { status: 'PENDING' },
    });
    const rejectedAssessments = await this.assessmentRepo.count({
      where: { status: 'REJECTED' },
    });

    // Global Stats (Calculated via SQL aggregate)
    const carbonLogsSum = await this.carbonLogRepo
      .createQueryBuilder('log')
      .select('SUM(log.total_emission)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const carbonReduction = Number(carbonLogsSum?.sum || 0);

    const finishedAssessments = await this.assessmentRepo.count({
      where: [{ status: 'APPROVED' }, { status: 'REJECTED' }],
    });
    const successRate =
      finishedAssessments > 0
        ? Math.round((approvedAssessments / finishedAssessments) * 100)
        : 0;

    // Storage stats from database
    const totalFiles = await this.evidenceFileRepo.count();
    const storageSum = await this.evidenceFileRepo
      .createQueryBuilder('file')
      .select('SUM(file.file_size)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const totalSizeBytes = Number(storageSum?.sum || 0);
    const storageUsageGb = Number(
      (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4),
    );

    return {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      assessmentRequests,
      carbonReduction,
      assessorCount: totalAssessors,
      verifiedAssessors,
      pendingAssessors,
      subscriptionRevenue,
      revenueMonth,
      planDistribution,
      assessmentStats: {
        total: assessmentRequests,
        approved: approvedAssessments,
        pending: pendingAssessments,
        rejected: rejectedAssessments,
      },
      storageUsageGb,
      totalFiles,
      successRate: successRate ?? 0,
      version: '2.0.1-sys-admin',
    };
  }

  async getRevenueStats() {
    const totalRevenueSum = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.status = :status', { status: 'PAID' })
      .select('SUM(inv.amount)', 'sum')
      .getRawOne<{ sum: string | null }>();
    const totalRevenue = Number(totalRevenueSum?.sum || 0);

    // Group by month using postgres date formatting
    const rawTrend = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.status = :status', { status: 'PAID' })
      .select("TO_CHAR(inv.created_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(inv.amount)', 'amount')
      .groupBy("TO_CHAR(inv.created_at, 'YYYY-MM')")
      .orderBy("TO_CHAR(inv.created_at, 'YYYY-MM')", 'ASC')
      .getRawMany<{ month: string; amount: string }>();

    const trend = rawTrend.map((t) => ({
      month: t.month,
      amount: Number(t.amount || 0),
    }));

    return {
      trend,
      totalRevenue,
    };
  }
}
