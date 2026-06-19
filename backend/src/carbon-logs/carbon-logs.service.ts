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
import { EmissionFactor } from './entities/emission-factor.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

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
      if (
        createDto.emission_factor_id &&
        createDto.usage_amount !== undefined
      ) {
        const factor = (await this.logRepository.manager.findOne(
          EmissionFactor,
          { where: { id: createDto.emission_factor_id } },
        )) as any;
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
        throw new InternalServerErrorException(
          'ไม่สามารถบันทึกข้อมูลคาร์บอนได้',
        );
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
        const factor = (await this.logRepository.manager.findOne(
          EmissionFactor,
          { where: { id: efId } },
        )) as any;
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

  async getCarbonTrend(orgId: number, startDate?: string, endDate?: string) {
    const qb = this.logRepository
      .createQueryBuilder('log')
      .where('log.org_id = :orgId', { orgId })
      .orderBy('log.created_at', 'ASC');

    if (startDate) {
      qb.andWhere('log.created_at >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      qb.andWhere('log.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const logs = await qb.getMany();

    const monthlyTrend: Record<string, number> = {};

    logs.forEach((log) => {
      const date = log.created_at
        ? new Date(log.created_at)
        : new Date(log.year || new Date().getFullYear(), (log.month || 1) - 1);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[monthYear] =
        (monthlyTrend[monthYear] || 0) + Number(log.total_emission || 0);
    });

    return Object.entries(monthlyTrend)
      .map(([month, emission]) => ({ month, emission }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getPersonalDashboard(userId: number, orgId?: number) {
    // Option B: ใช้ข้อมูล carbon ของ org ที่ user สังกัด
    // เนื่องจาก carbon_log ไม่มี user_id จึงแสดงภาพรวมขององค์กรใน context ของ user
    if (!orgId) {
      return {
        userId,
        totalEmission: 0,
        trend: [],
        logCount: 0,
        note: 'ไม่พบข้อมูลองค์กรที่สังกัด',
      };
    }

    const logs = await this.logRepository.find({
      where: { org_id: orgId },
      order: { created_at: 'ASC' },
    });

    const monthlyTrend: Record<string, number> = {};
    logs.forEach((log) => {
      const date = log.created_at
        ? new Date(log.created_at)
        : new Date(log.year || new Date().getFullYear(), (log.month || 1) - 1);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[monthYear] =
        (monthlyTrend[monthYear] || 0) + Number(log.total_emission || 0);
    });

    const trend = Object.entries(monthlyTrend)
      .map(([month, emission]) => ({ month, emission }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalEmission = logs.reduce(
      (sum, l) => sum + Number(l.total_emission || 0),
      0,
    );

    const profile = (await this.logRepository.manager.findOne(UserProfile, {
      where: { userId },
    })) as any;
    const personalGoalPercent = profile?.personal_goal_percent
      ? Number(profile.personal_goal_percent)
      : 0;

    return {
      userId,
      orgId,
      totalEmission: Math.round(totalEmission * 100) / 100,
      trend,
      logCount: logs.length,
      personalGoalPercent,
      note: 'ข้อมูลรวมขององค์กรที่สังกัด',
    };
  }
}
