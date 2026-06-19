import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessorProfile } from '../users/entities/assessor-profile.entity';
import { StripeService } from '../subscriptions/stripe.service';

@Injectable()
export class AssessorAdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessorProfile)
    private assessorProfileRepository: Repository<AssessorProfile>,
    private stripeService: StripeService,
  ) {}

  async assignAssessor(assessmentId: number, assessorId: number) {
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    assessment.assessor_user_id = assessorId;
    if (assessment.status === 'SUBMITTED') {
      assessment.status = 'IN_REVIEW';
    }
    await this.assessmentRepository.save(assessment);

    return {
      success: true,
      message: 'Assigned successfully',
      assessmentId,
      assessorId,
    };
  }

  async getAssessorPerformance(assessorId: number) {
    const assessments = await this.assessmentRepository.find({
      where: { assessor_user_id: assessorId },
    });

    const completed = assessments.filter((a) =>
      ['APPROVED', 'REJECTED'].includes(a.status),
    ).length;
    const pending = assessments.filter((a) =>
      ['IN_REVIEW', 'REVISION_REQUESTED'].includes(a.status),
    ).length;
    const approved = assessments.filter((a) => a.status === 'APPROVED').length;

    const approvalRate = completed > 0 ? (approved / completed) * 100 : 0;

    return {
      assessorId,
      completed,
      pending,
      approvalRate: Math.round(approvalRate * 10) / 10,
    };
  }

  async getDashboardStats() {
    // Stats from assessors
    const allAssessors = await this.usersRepository.find({
      where: { is_active: true },
      relations: ['roles'],
    });
    const assessors = allAssessors.filter((u) =>
      u.roles?.some(
        (r) => r.role_name === 'ASSESSOR' || r.role_name === 'ASSESSOR_ADMIN',
      ),
    );
    const totalAssessors = assessors.length;

    // Stats from assessments
    const allAssessments = await this.assessmentRepository.find();
    const assigned = allAssessments.filter(
      (a) => a.assessor_user_id !== null && a.assessor_user_id !== undefined,
    );
    const unassigned = allAssessments.filter(
      (a) => !a.assessor_user_id && ['PENDING', 'SUBMITTED'].includes(a.status),
    );
    const inReview = allAssessments.filter(
      (a) => a.status === 'IN_REVIEW',
    ).length;
    const completed = allAssessments.filter((a) =>
      ['APPROVED', 'REJECTED'].includes(a.status),
    ).length;
    const approved = allAssessments.filter(
      (a) => a.status === 'APPROVED',
    ).length;
    const globalApprovalRate =
      completed > 0 ? Math.round((approved / completed) * 100 * 10) / 10 : 0;

    // Recent assignments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAssignments = assigned.filter(
      (a) => a.updated_at && new Date(a.updated_at) >= thirtyDaysAgo,
    ).length;

    return {
      totalAssessors,
      assigned: assigned.length,
      unassigned: unassigned.length,
      inReview,
      completed,
      approved,
      globalApprovalRate,
      recentAssignments,
    };
  }

  async processPayout(assessorId: number, amount: number) {
    const profile = await this.assessorProfileRepository.findOne({
      where: { user: { id: assessorId } },
      relations: ['user', 'user.bank_accounts'],
    });

    if (!profile) throw new NotFoundException('Assessor profile not found');

    const bankAccount =
      profile.user?.bank_accounts?.find((b) => b.is_primary) ||
      profile.user?.bank_accounts?.[0];

    if (!bankAccount) {
      throw new Error('Assessor does not have a registered bank account');
    }

    // Call Stripe to process the payout / transfer
    const stripeTransfer = await this.stripeService.createPayoutOrTransfer(
      amount,
      'thb',
      bankAccount.account_no,
      assessorId,
    );

    return {
      id: stripeTransfer.id,
      amount: stripeTransfer.amount / 100,
      currency: stripeTransfer.currency.toUpperCase(),
      status: stripeTransfer.status === 'successful' ? 'PAID' : 'PENDING',
      date: new Date(stripeTransfer.created * 1000),
      bankName: bankAccount.bank_name,
      accountNo: bankAccount.account_no,
    };
  }
}
