import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutiveService } from './executive.service';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { SettingsService } from '../settings/settings.service';
import { NotFoundException } from '@nestjs/common';

describe('ExecutiveService', () => {
  let service: ExecutiveService;
  let mockOrgRepo: any;
  let mockAssessmentRepo: any;
  let mockCarbonRepo: any;
  let mockSettingsService: any;

  beforeEach(async () => {
    mockOrgRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test Org',
        target_reduction_percent: 20,
        baseline_carbon_emission: 1000,
      }),
    };

    mockAssessmentRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          total_score: 85,
          category_scores: { 'หมวดที่ 1': 90, 'หมวดที่ 2': 80 },
          updated_at: new Date('2026-01-01'),
          certificates: [],
        },
      ]),
    };

    mockCarbonRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            total_emission: 500,
            date: '2026-01-15',
            emission_factor: { scope: 1 },
          },
        ]),
        getRawMany: jest
          .fn()
          .mockResolvedValue([
            { unitName: 'Main Office', totalEmission: '500' },
          ]),
      }),
    };

    mockSettingsService = {
      getSetting: jest.fn().mockImplementation((key) => {
        if (key === 'industry_benchmark') return Promise.resolve(12000);
        if (key === 'defaultBaseYear') return Promise.resolve('2024');
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutiveService,
        {
          provide: getRepositoryToken(Assessment),
          useValue: mockAssessmentRepo,
        },
        { provide: getRepositoryToken(CarbonLog), useValue: mockCarbonRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<ExecutiveService>(ExecutiveService);
  });

  it('should calculate executive dashboard summary', async () => {
    const dashboard = await service.getDashboard(1);
    expect(dashboard).toBeDefined();
    expect(dashboard.orgName).toBe('Test Org');
    expect(dashboard.targetReductionPercent).toBe(20);
    expect(dashboard.approvedCount).toBe(1);
    expect(dashboard.avgApprovedScore).toBe(85);
  });

  it('should throw NotFoundException if organization not found', async () => {
    mockOrgRepo.findOne.mockResolvedValue(null);
    await expect(service.getDashboard(999)).rejects.toThrow(NotFoundException);
  });
});
