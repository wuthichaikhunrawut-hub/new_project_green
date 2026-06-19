import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { AssessorProfile } from './entities/assessor-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };
    const mockAudit = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(UserProfile), useValue: mockRepo },
        { provide: getRepositoryToken(AssessorProfile), useValue: mockRepo },
        { provide: getRepositoryToken(Role), useValue: mockRepo },
        { provide: getRepositoryToken(UserRole), useValue: mockRepo },
        { provide: getRepositoryToken(BankAccount), useValue: mockRepo },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
