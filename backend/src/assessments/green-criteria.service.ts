import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { Assessment } from './entities/assessment.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class GreenCriteriaService {
  constructor(
    @InjectRepository(GreenCriteriaMaster)
    private greenCriteriaRepository: Repository<GreenCriteriaMaster>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
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
    if (orgId && orgId > 0) {
      const passedAss = await this.assessmentRepository.findOne({
        where: { organization: { id: orgId }, status: 'APPROVED' },
      });
      hasPassed = !!passedAss;
    }

    const criteria = await this.greenCriteriaRepository.find({
      order: { category_number: 'ASC', criteria_code: 'ASC' },
    });

    const filtered =
      orgId && orgId > 0 && !hasPassed
        ? criteria.filter((item) => item.category_number !== 7)
        : criteria;

    return filtered.map((item) => ({
      id: item.id,
      category: item.category_number,
      code: item.criteria_code,
      name: item.criteria_name,
      maxScore: item.max_score,
      currentScore: 0,
      status: 'Pending',
    }));
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
}
