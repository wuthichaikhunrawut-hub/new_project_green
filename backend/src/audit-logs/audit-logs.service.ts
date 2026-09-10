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

  async logAction(
    userId: number | undefined,
    action: string,
    comment: string,
    assessmentDetailId?: number,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action,
      comment,
      action_by_user_id: userId,
      assessment_detail_id: assessmentDetailId,
    });
    return this.auditLogRepository.save(log);
  }

  async findAll(
    page?: number,
    limit?: number,
    orgId?: number,
  ): Promise<AuditLog[]> {
    const safeLimit = limit ? Math.min(Math.max(1, Number(limit)), 200) : 50;
    const safePage = page ? Math.max(1, Number(page)) : 1;
    const skip = (safePage - 1) * safeLimit;

    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.created_at', 'DESC')
      .skip(skip)
      .take(safeLimit);

    if (orgId) {
      query.andWhere('user.org_id = :orgId', { orgId });
    }

    return query.getMany();
  }
}
