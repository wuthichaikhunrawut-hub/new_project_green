import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionFactor } from './entities/emission-factor.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EmissionFactorsService {
  constructor(
    @InjectRepository(EmissionFactor)
    private emissionFactorRepository: Repository<EmissionFactor>,
    private auditLogsService: AuditLogsService,
  ) {}

  findAll() {
    return this.emissionFactorRepository.find({ order: { name: 'ASC' } });
  }

  async create(data: Partial<EmissionFactor>) {
    const item = this.emissionFactorRepository.create(data);
    const saved = await this.emissionFactorRepository.save(item);
    await this.auditLogsService.logAction(
      undefined,
      'CREATE_FACTOR',
      `Added Emission Factor: ${saved.name}`,
    );
    return saved;
  }

  async update(id: number, data: Partial<EmissionFactor>) {
    await this.emissionFactorRepository.update(id, data);
    const updated = await this.emissionFactorRepository.findOne({
      where: { id },
    });
    await this.auditLogsService.logAction(
      undefined,
      'UPDATE_FACTOR',
      `Updated Emission Factor: ${updated?.name}`,
    );
    return updated;
  }

  async remove(id: number) {
    const item = await this.emissionFactorRepository.findOne({ where: { id } });
    await this.emissionFactorRepository.delete(id);
    if (item) {
      await this.auditLogsService.logAction(
        undefined,
        'DELETE_FACTOR',
        `Deleted Emission Factor: ${item.name}`,
      );
    }
  }
}
