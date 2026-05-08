import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class GreenCriteriaService {
  constructor(
    @InjectRepository(GreenCriteriaMaster)
    private greenCriteriaRepository: Repository<GreenCriteriaMaster>,
    private auditLogsService: AuditLogsService
  ) {}

  findAll() {
    return this.greenCriteriaRepository.find({ order: { category_number: 'ASC', criteria_code: 'ASC' } });
  }

  findAllForFrontend() {
    return this.greenCriteriaRepository.find({ 
      order: { category_number: 'ASC', criteria_code: 'ASC' } 
    }).then(criteria => criteria.map(item => ({
      id: item.id,
      category: item.category_number,
      code: item.criteria_code,
      name: item.criteria_name,
      maxScore: item.max_score,
      currentScore: 0,
      status: 'Pending'
    })));
  }

  async create(data: Partial<GreenCriteriaMaster>) {
    const item = this.greenCriteriaRepository.create(data);
    const saved = await this.greenCriteriaRepository.save(item);
    await this.auditLogsService.logAction(undefined, 'CREATE_CRITERIA', `Added new criteria: ${saved.criteria_name}`);
    return saved;
  }

  async update(id: number, data: Partial<GreenCriteriaMaster>) {
    await this.greenCriteriaRepository.update(id, data);
    const updated = await this.greenCriteriaRepository.findOne({ where: { id } });
    await this.auditLogsService.logAction(undefined, 'UPDATE_CRITERIA', `Updated criteria: ${updated?.criteria_name}`);
    return updated;
  }

  async remove(id: number) {
    const item = await this.greenCriteriaRepository.findOne({ where: { id } });
    await this.greenCriteriaRepository.delete(id);
    if (item) {
      await this.auditLogsService.logAction(undefined, 'DELETE_CRITERIA', `Deleted criteria: ${item.criteria_name}`);
    }
  }
}
