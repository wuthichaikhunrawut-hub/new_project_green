import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { Assessment } from './entities/assessment.entity';
import { AssessmentDetail } from './entities/assessment-detail.entity';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentDetail)
    private assessmentDetailRepository: Repository<AssessmentDetail>,
    @InjectRepository(GreenCriteriaMaster)
    private criteriaRepository: Repository<GreenCriteriaMaster>,
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
        relations: ['organization', 'assessor', 'certificates'],
        order: { submitted_at: 'DESC' },
      });
    }

    // ASSESSOR: show all assessments so they can pick up any pending work
    // (assignment UI not yet implemented - this ensures assessors are not blocked)
    if (normalizedRole === 'ASSESSOR') {
      return this.assessmentRepository.find({
        relations: ['organization', 'assessor', 'certificates'],
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
    const assessment = await this.findOne(id, orgId);

    // Update main assessment fields
    if (updateAssessmentDto.status)
      assessment.status = updateAssessmentDto.status;
    if (updateAssessmentDto.total_score !== undefined)
      assessment.total_score = updateAssessmentDto.total_score;
    if (updateAssessmentDto.certified_level)
      assessment.certified_level = updateAssessmentDto.certified_level;

    await this.assessmentRepository.save(assessment);

    // Update details if provided (e.g., scores from Assessor)
    if (updateAssessmentDto.details && updateAssessmentDto.details.length > 0) {
      const detailsToSave: AssessmentDetail[] = [];
      for (const updateDetail of updateAssessmentDto.details) {
        const detailToUpdate = assessment.details.find(
          (d) => d.id === updateDetail.assessment_detail_id,
        );
        if (detailToUpdate) {
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
        await this.assessmentDetailRepository.save(detailsToSave);
      }
    }

    return this.findOne(id, orgId);
  }

  async remove(id: number, orgId: number): Promise<void> {
    const assessment = await this.findOne(id, orgId);
    await this.assessmentRepository.remove(assessment);
  }
}
