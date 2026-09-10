import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionFactor } from './entities/emission-factor.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EmissionFactorsService {
  private cachedFactors: EmissionFactor[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000;

  constructor(
    @InjectRepository(EmissionFactor)
    private emissionFactorRepository: Repository<EmissionFactor>,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll() {
    const now = Date.now();
    if (this.cachedFactors && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedFactors;
    }
    const factors = await this.emissionFactorRepository.find({
      order: { name: 'ASC' },
    });
    this.cachedFactors = factors;
    this.lastFetchTime = now;
    return factors;
  }

  async create(data: Partial<EmissionFactor>) {
    this.cachedFactors = null;
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
    this.cachedFactors = null;
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
    this.cachedFactors = null;
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
