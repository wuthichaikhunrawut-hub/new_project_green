import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invoice } from '../subscriptions/entities/invoice.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { OrganizationSubscription } from '../subscriptions/entities/organization-subscription.entity';
import { AssessorProfile } from '../users/entities/assessor-profile.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockOrgRepo: any;
  let mockUserRepo: any;
  let mockInvoiceRepo: any;
  let mockAssessorRepo: any;
  let mockAssessmentRepo: any;
  let mockCarbonRepo: any;
  let mockEvidenceRepo: any;
  let mockOrgSubRepo: any;

  beforeEach(async () => {
    mockOrgRepo = {
      count: jest.fn().mockResolvedValue(5),
    };
    mockUserRepo = {
      count: jest.fn().mockResolvedValue(25),
    };
    mockAssessorRepo = {
      count: jest.fn().mockResolvedValue(4),
    };
    mockInvoiceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '150000' }),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };
    mockAssessmentRepo = {
      count: jest.fn().mockResolvedValue(10),
    };
    mockCarbonRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '5200' }),
      }),
    };
    mockEvidenceRepo = {
      count: jest.fn().mockResolvedValue(42),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '1048576' }),
      }),
    };
    mockOrgSubRepo = {
      count: jest.fn().mockResolvedValue(3),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        {
          provide: getRepositoryToken(Assessment),
          useValue: mockAssessmentRepo,
        },
        {
          provide: getRepositoryToken(OrganizationSubscription),
          useValue: mockOrgSubRepo,
        },
        {
          provide: getRepositoryToken(AssessorProfile),
          useValue: mockAssessorRepo,
        },
        { provide: getRepositoryToken(CarbonLog), useValue: mockCarbonRepo },
        {
          provide: getRepositoryToken(EvidenceFile),
          useValue: mockEvidenceRepo,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should compile admin stats', async () => {
    const stats = await service.getAdminStats();
    expect(stats).toBeDefined();
    expect(stats.totalOrganizations).toBe(5);
    expect(stats.totalUsers).toBe(25);
    expect(stats.subscriptionRevenue).toBe(150000);
    expect(stats.totalFiles).toBe(42);
  });

  it('should compile revenue stats', async () => {
    const revenue = await service.getRevenueStats();
    expect(revenue).toBeDefined();
    expect(revenue.totalRevenue).toBe(150000);
  });
});
