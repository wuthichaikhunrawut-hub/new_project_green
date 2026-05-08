import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(userId: number | undefined, action: string, comment: string, assessmentDetailId?: number): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action,
      comment,
      action_by_user_id: userId,
      assessment_detail_id: assessmentDetailId
    });
    return this.auditLogRepository.save(log);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: 100 // default limit
    });
  }
}
