import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let mockRepository: any;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        action: 'UPDATE',
        comment: 'Score changed',
        user: { id: 10, org_id: 1 },
      },
    ]),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 1,
        ...dto,
        created_at: new Date(),
      })),
      save: jest.fn().mockImplementation((log) => Promise.resolve(log)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should log an action properly', async () => {
    const result = await service.logAction(10, 'APPROVE', 'Looks good', 5);
    expect(mockRepository.create).toHaveBeenCalledWith({
      action: 'APPROVE',
      comment: 'Looks good',
      action_by_user_id: 10,
      assessment_detail_id: 5,
    });
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.action).toBe('APPROVE');
  });

  it('should find all with pagination and orgId filter', async () => {
    const logs = await service.findAll(2, 10, 1);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('log');
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'user.org_id = :orgId',
      { orgId: 1 },
    );
    expect(logs).toHaveLength(1);
  });
});
