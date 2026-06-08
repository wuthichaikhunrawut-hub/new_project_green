import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { Assessment } from './entities/assessment.entity';
import { AssessmentDetail } from './entities/assessment-detail.entity';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { MailService } from '../notifications/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentDetail)
    private assessmentDetailRepository: Repository<AssessmentDetail>,
    @InjectRepository(GreenCriteriaMaster)
    private criteriaRepository: Repository<GreenCriteriaMaster>,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto, orgId: number) {
    const assessment = this.assessmentRepository.create({
      ...createAssessmentDto,
      status: createAssessmentDto.status || 'PENDING',
      organization: { id: orgId },
      assessment_year:
        createAssessmentDto.assessment_year || new Date().getFullYear(),
    });

    const savedAssessment = await this.assessmentRepository.save(assessment);

    // Initialize Assessment Details based on Criteria Master
    const hasPassed = await this.assessmentRepository.findOne({
      where: { organization: { id: orgId }, status: 'APPROVED' },
    });

    let criteriaList = await this.criteriaRepository.find();
    if (!hasPassed) {
      criteriaList = criteriaList.filter((c) => c.category_number !== 7);
    }

    const details = criteriaList.map((criteria) => {
      return this.assessmentDetailRepository.create({
        assessment: savedAssessment,
        criteria: criteria,
        self_score: 0,
        assessor_score: 0,
      });
    });

    if (details.length > 0) {
      await this.assessmentDetailRepository.save(details);
    }

    return this.findOne(savedAssessment.id, orgId);
  }

  async getDraft(orgId: number): Promise<Assessment> {
    let draft = await this.assessmentRepository.findOne({
      where: { organization: { id: orgId }, status: 'DRAFT' },
      relations: [
        'organization',
        'details',
        'details.criteria',
        'details.evidence_files',
      ],
    });

    if (!draft) {
      // Create a new draft if not exists
      const createAssessmentDto = new CreateAssessmentDto();
      createAssessmentDto.status = 'DRAFT';
      // create() uses findOne which loads relations
      draft = await this.create(createAssessmentDto, orgId);
    }
    return draft;
  }

  async findAll(
    orgId: number,
    role: string = '',
    assessorId?: string,
  ): Promise<Assessment[]> {
    const normalizedRole = String(role || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    if (normalizedRole === 'ADMIN' || normalizedRole === 'SYSTEM_ADMIN') {
      return this.assessmentRepository.find({
        relations: ['organization', 'assessor', 'assessor.user_profile', 'certificates'],
        order: { submitted_at: 'DESC' },
      });
    }

    if (normalizedRole === 'ASSESSOR' || normalizedRole === 'ASSESSOR_ADMIN') {
      const whereCondition = normalizedRole === 'ASSESSOR' && assessorId 
        ? { assessor_user_id: Number(assessorId) } 
        : {};

      return this.assessmentRepository.find({
        where: whereCondition,
        relations: ['organization', 'assessor', 'assessor.user_profile', 'certificates'],
        order: { submitted_at: 'DESC' },
      });
    }

    return this.assessmentRepository.find({
      where: { organization: { id: orgId } },
      relations: ['organization', 'certificates'],
      order: { submitted_at: 'DESC' },
    });
  }

  async findOne(id: number, orgId: number): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: orgId ? { id, organization: { id: orgId } } : { id },
      relations: [
        'organization',
        'details',
        'details.criteria',
        'details.evidence_files',
        'certificates',
      ],
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    return assessment;
  }

  async update(
    id: number,
    updateAssessmentDto: UpdateAssessmentDto,
    orgId: number,
  ) {
    return await this.assessmentRepository.manager.transaction(async (tem) => {
      const assessment = await tem.findOne(Assessment, {
        where: orgId ? { id, organization: { id: orgId } } : { id },
        relations: ['details', 'organization'],
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      const oldStatus = assessment.status;

      // Update main assessment fields
      if (updateAssessmentDto.status)
        assessment.status = updateAssessmentDto.status;
      if (updateAssessmentDto.total_score !== undefined)
        assessment.total_score = updateAssessmentDto.total_score;
      if (updateAssessmentDto.certified_level)
        assessment.certified_level = updateAssessmentDto.certified_level;
      if (updateAssessmentDto.assessor_user_id !== undefined)
        assessment.assessor_user_id = updateAssessmentDto.assessor_user_id;

      await tem.save(assessment);

      // Update details if provided (e.g., scores from self-assessment or Assessor)
      if (updateAssessmentDto.details && updateAssessmentDto.details.length > 0) {
        const detailsToSave: AssessmentDetail[] = [];
        for (const updateDetail of updateAssessmentDto.details) {
          const detailToUpdate = assessment.details.find(
            (d) => d.id === updateDetail.assessment_detail_id,
          );
          if (detailToUpdate) {
            detailToUpdate.self_score =
              updateDetail.self_score !== undefined
                ? updateDetail.self_score
                : detailToUpdate.self_score;
            detailToUpdate.applicant_comment =
              updateDetail.applicant_comment !== undefined
                ? updateDetail.applicant_comment
                : detailToUpdate.applicant_comment;
            detailToUpdate.assessor_score =
              updateDetail.assessor_score !== undefined
                ? updateDetail.assessor_score
                : detailToUpdate.assessor_score;
            detailToUpdate.auditor_comment =
              updateDetail.auditor_comment !== undefined
                ? updateDetail.auditor_comment
                : detailToUpdate.auditor_comment;
            detailsToSave.push(detailToUpdate);
          }
        }

        if (detailsToSave.length > 0) {
          await tem.save(detailsToSave);
        }
      }

      // Recalculate total_score dynamically based on the sum of all details
      const freshDetails = await tem.find(AssessmentDetail, {
        where: { assessment: { id: assessment.id } },
      });
      const newTotalScore = freshDetails.reduce((sum, d) => {
        // Use assessor_score if set, otherwise fallback to self_score
        const score = d.assessor_score !== null && d.assessor_score !== undefined
          ? Number(d.assessor_score)
          : Number(d.self_score || 0);
        return sum + score;
      }, 0);

      assessment.total_score = newTotalScore;
      await tem.save(assessment);

      // Email notifications based on status change
      if (updateAssessmentDto.status && oldStatus !== updateAssessmentDto.status) {
        // Find org admin user
        const adminUser = await this.usersService.findOrgAdmin(assessment.organization.id);
        if (adminUser) {
          if (updateAssessmentDto.status === 'SUBMITTED') {
            const html = this.mailService.getAssessmentSubmittedTemplate(assessment.organization.name);
            this.mailService.sendMail(adminUser.email, 'ระบบได้รับข้อมูลการประเมินแล้ว', html).catch(e => console.error(e));
          } else if (['REVISION_REQUESTED', 'APPROVED', 'REJECTED'].includes(updateAssessmentDto.status)) {
            const html = this.mailService.getAssessmentReviewedTemplate(assessment.organization.name, updateAssessmentDto.status);
            this.mailService.sendMail(adminUser.email, 'แจ้งผลการประเมินเบื้องต้น', html).catch(e => console.error(e));
          }
        }
      }

      return await tem.findOne(Assessment, {
        where: orgId ? { id, organization: { id: orgId } } : { id },
        relations: [
          'organization',
          'details',
          'details.criteria',
          'details.evidence_files',
          'certificates',
        ],
      });
    });
  }

  async remove(id: number, orgId: number): Promise<void> {
    const assessment = await this.findOne(id, orgId);
    await this.assessmentRepository.remove(assessment);
  }
}
