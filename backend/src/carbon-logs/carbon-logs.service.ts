import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonLog } from './entities/carbon-log.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateCarbonLogDto } from './dto/create-carbon-log.dto';
import { UpdateCarbonLogDto } from './dto/update-carbon-log.dto';

@Injectable()
export class CarbonLogsService {
  constructor(
    @InjectRepository(CarbonLog)
    private logRepository: Repository<CarbonLog>,
  ) {}

  async create(createDto: CreateCarbonLogDto, orgId: number) {
    try {
      const log = this.logRepository.create({
        ...createDto,
        organization: { id: orgId } as Organization,
      });

      // Recalculate total_emission on backend if factor exists
      if (createDto.emission_factor_id && createDto.usage_amount !== undefined) {
        const factor = await this.logRepository.manager.findOne(
          'EmissionFactor',
          { where: { id: createDto.emission_factor_id } }
        ) as any;
        if (factor && factor.factor_value != null) {
          log.total_emission = createDto.usage_amount * factor.factor_value;
        }
      }

      const saved = await this.logRepository.save(log);
      const res = await this.logRepository.findOne({
        where: { id: saved.id },
        relations: ['emission_factor'],
      });
      if (!res) {
        throw new InternalServerErrorException('ไม่สามารถบันทึกข้อมูลคาร์บอนได้');
      }
      return res;
    } catch (e) {
      console.error('create carbon log error:', e);
      throw new InternalServerErrorException('ไม่สามารถบันทึกข้อมูลคาร์บอนได้');
    }
  }

  async findAll(orgId: number): Promise<CarbonLog[]> {
    try {
      return await this.logRepository.find({
        where: { org_id: orgId },
        relations: ['emission_factor'],
        order: { year: 'DESC', month: 'DESC', created_at: 'DESC' },
      });
    } catch {
      throw new InternalServerErrorException('ไม่สามารถโหลดข้อมูลคาร์บอนได้');
    }
  }

  async update(
    id: number,
    orgId: number,
    updateDto: UpdateCarbonLogDto,
  ): Promise<CarbonLog> {
    try {
      const log = await this.logRepository.findOne({
        where: { id, org_id: orgId },
        relations: ['emission_factor'],
      });
      if (!log) {
        throw new NotFoundException('ไม่พบข้อมูลรายการนี้');
      }

      Object.assign(log, updateDto);

      // If emission_factor_id was updated or usage_amount was updated, recalculate total_emission
      const efId = updateDto.emission_factor_id ?? log.emission_factor_id;
      const usage = updateDto.usage_amount ?? log.usage_amount;

      if (efId && usage !== undefined) {
        const factor = await this.logRepository.manager.findOne(
          'EmissionFactor',
          { where: { id: efId } }
        ) as any;
        if (factor && factor.factor_value != null) {
          log.total_emission = usage * factor.factor_value;
        }
      }

      await this.logRepository.save(log);

      const res = await this.logRepository.findOne({
        where: { id },
        relations: ['emission_factor'],
      });
      if (!res) {
        throw new NotFoundException('ไม่พบข้อมูลรายการนี้');
      }
      return res;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('ไม่สามารถแก้ไขข้อมูลคาร์บอนได้');
    }
  }

  async remove(id: number, orgId: number): Promise<void> {
    try {
      const log = await this.logRepository.findOne({
        where: { id, org_id: orgId },
      });
      if (!log) {
        throw new NotFoundException('ไม่พบข้อมูลรายการนี้');
      }
      await this.logRepository.remove(log);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('ไม่สามารถลบข้อมูลคาร์บอนได้');
    }
  }
}
