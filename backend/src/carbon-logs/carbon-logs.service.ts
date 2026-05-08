import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonLog } from './entities/carbon-log.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Injectable()
export class CarbonLogsService {
  constructor(
    @InjectRepository(CarbonLog)
    private logRepository: Repository<CarbonLog>,
  ) {}

  async create(createDto: any, orgId: number) {
    const log = this.logRepository.create({
      ...createDto,
      organization: { id: orgId } as Organization,
    });
    return this.logRepository.save(log);
  }

  async findAll(orgId: number): Promise<CarbonLog[]> {
    return this.logRepository.find({
      where: { org_id: orgId },
      order: { year: 'DESC', month: 'DESC', created_at: 'DESC' },
    });
  }

  async remove(id: number, orgId: number): Promise<void> {
    const log = await this.logRepository.findOne({ where: { id, org_id: orgId } });
    if (!log) {
      throw new NotFoundException('ไม่พบข้อมูลรายการนี้');
    }
    await this.logRepository.remove(log);
  }
}
