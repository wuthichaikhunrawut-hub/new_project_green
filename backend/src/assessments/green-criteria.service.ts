import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { Assessment } from './entities/assessment.entity';
import { AssessmentDetail } from './entities/assessment-detail.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class GreenCriteriaService {
  constructor(
    @InjectRepository(GreenCriteriaMaster)
    private greenCriteriaRepository: Repository<GreenCriteriaMaster>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentDetail)
    private assessmentDetailRepository: Repository<AssessmentDetail>,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll(orgId?: number) {
    let hasPassed = false;
    if (orgId && orgId > 0) {
      const passedAss = await this.assessmentRepository.findOne({
        where: { organization: { id: orgId }, status: 'APPROVED' },
      });
      hasPassed = !!passedAss;
    }

    const criteria = await this.greenCriteriaRepository.find({
      order: { category_number: 'ASC', criteria_code: 'ASC' },
    });

    if (orgId && orgId > 0 && !hasPassed) {
      return criteria.filter((item) => item.category_number !== 7);
    }
    return criteria;
  }

  async findAllForFrontend(orgId?: number) {
    let hasPassed = false;
    let pendingAssId = 0;
    if (orgId && orgId > 0) {
      const passedAss = await this.assessmentRepository.findOne({
        where: { organization: { id: orgId }, status: 'APPROVED' },
      });
      hasPassed = !!passedAss;
      
      const pendingAss = await this.assessmentRepository.findOne({
        where: { organization: { id: orgId }, status: 'PENDING' },
      });
      if (pendingAss) {
        pendingAssId = pendingAss.id;
      }
    }

    const criteria = await this.greenCriteriaRepository.find({
      order: { category_number: 'ASC', criteria_code: 'ASC' },
    });

    const filtered =
      orgId && orgId > 0 && !hasPassed
        ? criteria.filter((item) => item.category_number !== 7)
        : criteria;

    let details: AssessmentDetail[] = [];
    if (pendingAssId > 0) {
      details = await this.assessmentDetailRepository.find({
        where: { assessment: { id: pendingAssId } },
      });
    }

    return filtered.map((item) => {
      const detail = details.find(d => d.criteria_id === item.id);
      return {
        id: item.id,
        category: item.category_number,
        code: item.criteria_code,
        name: item.criteria_name,
        maxScore: item.max_score,
        currentScore: detail ? (detail.self_score || 0) : 0,
        status: detail && detail.self_score > 0 ? 'Completed' : 'Pending',
      };
    });
  }

  async create(data: Partial<GreenCriteriaMaster>) {
    const item = this.greenCriteriaRepository.create(data);
    const saved = await this.greenCriteriaRepository.save(item);
    await this.auditLogsService.logAction(
      undefined,
      'CREATE_CRITERIA',
      `Added new criteria: ${saved.criteria_name}`,
    );
    return saved;
  }

  async update(id: number, data: Partial<GreenCriteriaMaster>) {
    await this.greenCriteriaRepository.update(id, data);
    const updated = await this.greenCriteriaRepository.findOne({
      where: { id },
    });
    await this.auditLogsService.logAction(
      undefined,
      'UPDATE_CRITERIA',
      `Updated criteria: ${updated?.criteria_name}`,
    );
    return updated;
  }

  async remove(id: number) {
    const item = await this.greenCriteriaRepository.findOne({ where: { id } });
    await this.greenCriteriaRepository.delete(id);
    if (item) {
      await this.auditLogsService.logAction(
        undefined,
        'DELETE_CRITERIA',
        `Deleted criteria: ${item.criteria_name}`,
      );
    }
  }

  async updateScore(criteriaId: number, score: number, orgId: number) {
    if (!orgId) {
      return { success: false, message: 'Organization ID is required' };
    }

    // Find the active (PENDING) assessment for this org
    let assessment = await this.assessmentRepository.findOne({
      where: { organization: { id: orgId }, status: 'PENDING' },
    });

    // If no pending assessment, create one
    if (!assessment) {
      assessment = this.assessmentRepository.create({
        organization: { id: orgId },
        status: 'PENDING',
        total_score: 0,
      });
      assessment = await this.assessmentRepository.save(assessment);
    }

    // Find or create assessment detail for this criteria
    let detail = await this.assessmentDetailRepository.findOne({
      where: { assessment: { id: assessment.id }, criteria: { id: criteriaId } },
    });

    if (!detail) {
      detail = this.assessmentDetailRepository.create({
        assessment: { id: assessment.id },
        criteria: { id: criteriaId },
        self_score: score,
      });
    } else {
      detail.self_score = score;
    }

    await this.assessmentDetailRepository.save(detail);

    // Recalculate total score
    const allDetails = await this.assessmentDetailRepository.find({
      where: { assessment: { id: assessment.id } },
    });
    
    const totalScore = allDetails.reduce((sum, d) => sum + (d.self_score || 0), 0);
    assessment.total_score = totalScore;
    await this.assessmentRepository.save(assessment);

    await this.auditLogsService.logAction(
      orgId,
      'UPDATE_SCORE',
      `Updated score for criteria ${criteriaId} to ${score}`,
    );

    return { success: true, criteriaId, score, totalScore };
  }
}
