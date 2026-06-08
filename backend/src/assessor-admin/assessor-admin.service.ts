import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessorProfile } from '../users/entities/assessor-profile.entity';

@Injectable()
export class AssessorAdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessorProfile)
    private assessorProfileRepository: Repository<AssessorProfile>,
  ) {}

  async assignAssessor(assessmentId: number, assessorId: number) {
    const assessment = await this.assessmentRepository.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    
    assessment.assessor_user_id = assessorId;
    if (assessment.status === 'SUBMITTED') {
      assessment.status = 'IN_REVIEW';
    }
    await this.assessmentRepository.save(assessment);
    
    return { success: true, message: 'Assigned successfully', assessmentId, assessorId };
  }

  async getAssessorPerformance(assessorId: number) {
    const assessments = await this.assessmentRepository.find({ where: { assessor_user_id: assessorId } });
    
    const completed = assessments.filter(a => ['APPROVED', 'REJECTED'].includes(a.status)).length;
    const pending = assessments.filter(a => ['IN_REVIEW', 'REVISION_REQUESTED'].includes(a.status)).length;
    const approved = assessments.filter(a => a.status === 'APPROVED').length;
    
    const approvalRate = completed > 0 ? (approved / completed) * 100 : 0;

    return {
      assessorId,
      completed,
      pending,
      approvalRate: Math.round(approvalRate * 10) / 10,
    };
  }

  async processPayout(assessorId: number, amount: number) {
    const profile = await this.assessorProfileRepository.findOne({ 
      where: { user: { id: assessorId } },
      relations: ['user', 'user.bank_accounts']
    });

    if (!profile) throw new NotFoundException('Assessor profile not found');

    const bankAccount = profile.user?.bank_accounts?.find(b => b.is_primary) || profile.user?.bank_accounts?.[0];
    
    if (!bankAccount) {
      throw new Error('Assessor does not have a registered bank account');
    }

    // Mock payout process
    const payoutRecord = {
      assessorId,
      amount,
      bankName: bankAccount.bank_name,
      accountNo: bankAccount.account_no,
      status: 'PAID',
      date: new Date()
    };

    return payoutRecord;
  }
}
