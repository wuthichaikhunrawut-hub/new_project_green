import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { ResubmitRevisionDto } from './dto/resubmit-revision.dto';
import { SendToUserDto } from './dto/send-to-user.dto';

@Injectable()
export class OrgAdminService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(CarbonLog)
    private readonly carbonRepo: Repository<CarbonLog>,
  ) {}

  async getRevisionCenter(orgId: number): Promise<{
    revisions: Assessment[];
    carbonLogs: CarbonLog[];
  }> {
    try {
      const revisions = await this.assessmentRepo.find({
        where: { org_id: orgId, status: 'REVISION_REQUESTED' },
        relations: ['details', 'details.criteria', 'details.evidence_files'],
        order: { updated_at: 'DESC' },
      });

      const carbonLogs = await this.carbonRepo.find({
        where: { org_id: orgId },
        relations: ['emission_factor'],
        order: { year: 'DESC', month: 'DESC', created_at: 'DESC' },
      });

      return { revisions, carbonLogs };
    } catch {
      throw new InternalServerErrorException(
        'ไม่สามารถโหลดข้อมูล Revision Center ได้',
      );
    }
  }

  async sendToUser(
    assessmentId: number,
    orgId: number,
    dto: SendToUserDto,
  ): Promise<Assessment> {
    try {
      if (!dto.notes?.trim()) {
        throw new BadRequestException('กรุณาระบุข้อความสำหรับส่งกลับผู้ใช้งาน');
      }
      const assessment = await this.assessmentRepo.findOne({
        where: { id: assessmentId, org_id: orgId, status: 'REVISION_REQUESTED' },
      });
      if (!assessment) {
        throw new NotFoundException('ไม่พบงานที่ตีกลับสำหรับองค์กรนี้');
      }

      assessment.notes = dto.notes.trim();
      return await this.assessmentRepo.save(assessment);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('ไม่สามารถส่งงานกลับให้ผู้ใช้งานได้');
    }
  }

  async resubmitRevision(
    assessmentId: number,
    orgId: number,
    dto: ResubmitRevisionDto,
  ): Promise<Assessment> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: assessmentId, org_id: orgId, status: 'REVISION_REQUESTED' },
      });
      if (!assessment) {
        throw new NotFoundException('ไม่พบงานที่ตีกลับสำหรับองค์กรนี้');
      }

      assessment.status = 'SUBMITTED';
      if (dto.notes?.trim()) {
        assessment.notes = dto.notes.trim();
      }
      assessment.submitted_at = new Date();
      return await this.assessmentRepo.save(assessment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('ไม่สามารถส่งกลับให้ผู้ตรวจประเมินได้');
    }
  }
}
