import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssessorService } from './assessor.service';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessmentDetail } from '../assessments/entities/assessment-detail.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { Certificate } from '../assessments/entities/certificate.entity';
import { StripeService } from '../subscriptions/stripe.service';

describe('AssessorService performance paths', () => {
  let service: AssessorService;
  let assessmentRepo: { find: jest.Mock; exists: jest.Mock };
  let getRawMany: jest.Mock;

  beforeEach(async () => {
    assessmentRepo = { find: jest.fn(), exists: jest.fn() };
    getRawMany = jest.fn().mockResolvedValue([
      { orgId: '7', scope: '2', logCount: '3', totalEmission: '120.5' },
      { orgId: '8', scope: '1', logCount: '1', totalEmission: '30' },
    ]);
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessorService,
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepo },
        { provide: getRepositoryToken(AssessmentDetail), useValue: {} },
        {
          provide: getRepositoryToken(CarbonLog),
          useValue: { createQueryBuilder: jest.fn(() => queryBuilder) },
        },
        { provide: getRepositoryToken(Certificate), useValue: {} },
        { provide: StripeService, useValue: {} },
      ],
    }).compile();

    service = module.get(AssessorService);
  });

  it('loads assignments and all organization carbon summaries with two queries total', async () => {
    assessmentRepo.find.mockResolvedValue([
      {
        id: 1,
        org_id: 7,
        organization: { id: 7, name: 'Org A' },
        status: 'PENDING',
        certificates: [],
      },
      {
        id: 2,
        org_id: 8,
        organization: { id: 8, name: 'Org B' },
        status: 'SUBMITTED',
        certificates: [],
      },
    ]);

    const result = await service.getAssignments(12);

    expect(assessmentRepo.find).toHaveBeenCalledTimes(1);
    expect(getRawMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0].carbonSummary.totalEmission).toBe(120.5);
    expect(result[1].carbonSummary.totalEmission).toBe(30);
  });

  it('filters history by the current assessor', async () => {
    assessmentRepo.find.mockResolvedValue([]);

    await service.getHistory(12);

    expect(assessmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assessor_user_id: 12 }),
      }),
    );
    expect(getRawMany).not.toHaveBeenCalled();
  });

  it('rejects carbon access when the assessor has no assignment in the organization', async () => {
    assessmentRepo.exists.mockResolvedValue(false);

    await expect(
      service.assertAssessorOrganizationAccess(12, 99),
    ).rejects.toMatchObject({ status: 403 });
    expect(assessmentRepo.exists).toHaveBeenCalledWith({
      where: { assessor_user_id: 12, org_id: 99 },
    });
  });
});
