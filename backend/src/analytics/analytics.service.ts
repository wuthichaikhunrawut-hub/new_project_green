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

    // Revenue Stats
    const invoices = await this.invoiceRepo.find({ where: { status: 'PAID' } });
    const subscriptionRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0,
    );

    // Revenue this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInvoices = invoices.filter(
      (inv) => new Date(inv.created_at) >= thirtyDaysAgo,
    );
    const revenueMonth = recentInvoices.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0,
    );

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

    // Global Stats (Calculated)
    const carbonLogs = await this.carbonLogRepo.find();
    const carbonReduction = carbonLogs.reduce(
      (sum, log) => sum + Number(log.total_emission || 0),
      0,
    );

    const finishedAssessments = await this.assessmentRepo.count({
      where: [{ status: 'APPROVED' }, { status: 'REJECTED' }],
    });
    const successRate =
      finishedAssessments > 0
        ? Math.round((approvedAssessments / finishedAssessments) * 100)
        : 0;

    // Storage stats from database
    const totalFiles = await this.evidenceFileRepo.count();
    const files = await this.evidenceFileRepo.find({ select: ['file_size'] });
    const totalSizeBytes = files.reduce((sum, f) => sum + Number(f.file_size || 0), 0);
    const storageUsageGb = Number((totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4));

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
    const invoices = await this.invoiceRepo.find({ where: { status: 'PAID' } });
    
    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    
    invoices.forEach((inv) => {
      const date = new Date(inv.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + Number(inv.amount || 0);
    });

    const trend = Object.entries(monthlyRevenue)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      trend,
      totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
    };
  }
}
