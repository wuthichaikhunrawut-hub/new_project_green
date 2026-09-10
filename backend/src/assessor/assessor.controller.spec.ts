import { Test, TestingModule } from '@nestjs/testing';
import { AssessorController } from './assessor.controller';
import { AssessorService } from './assessor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ForbiddenException } from '@nestjs/common';

describe('AssessorController', () => {
  let controller: AssessorController;
  let assessorService: {
    getOrgCarbonSummary: jest.Mock;
    getDashboard: jest.Mock;
    assertAssessorOrganizationAccess: jest.Mock;
    getAssessmentDetail: jest.Mock;
  };

  beforeEach(async () => {
    assessorService = {
      getOrgCarbonSummary: jest.fn(),
      getDashboard: jest.fn(),
      assertAssessorOrganizationAccess: jest.fn(),
      getAssessmentDetail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessorController],
      providers: [{ provide: AssessorService, useValue: assessorService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssessorController>(AssessorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('blocks tenant user from viewing carbon summary of another organization', async () => {
    await expect(
      controller.getCarbonSummary(99, {
        user: { sub: 1, email: 'emp@test.com', role: 'EMPLOYEE', orgId: 10 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows tenant user to view carbon summary of their own organization', async () => {
    assessorService.getOrgCarbonSummary.mockReturnValue({ totalEmission: 500 });

    const result = await controller.getCarbonSummary(10, {
      user: { sub: 1, email: 'emp@test.com', role: 'EMPLOYEE', orgId: 10 },
    });

    expect(result).toEqual({ totalEmission: 500 });
    expect(assessorService.getOrgCarbonSummary).toHaveBeenCalledWith(10);
  });

  it('allows ASSESSOR to view carbon summary of an assigned organization', async () => {
    assessorService.getOrgCarbonSummary.mockReturnValue({ totalEmission: 800 });

    const result = await controller.getCarbonSummary(99, {
      user: { sub: 2, email: 'assessor@test.com', role: 'ASSESSOR' },
    });

    expect(result).toEqual({ totalEmission: 800 });
    expect(
      assessorService.assertAssessorOrganizationAccess,
    ).toHaveBeenCalledWith(2, 99);
    expect(assessorService.getOrgCarbonSummary).toHaveBeenCalledWith(99);
  });

  it('blocks tenant users from reading another organization assessment', async () => {
    assessorService.getAssessmentDetail.mockResolvedValue({
      id: 55,
      org_id: 99,
      assessor_user_id: null,
    });

    await expect(
      controller.getAssessment(55, {
        user: { sub: 1, email: 'org@test.com', role: 'ORG_ADMIN', orgId: 10 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks assessors from reading work assigned to another assessor', async () => {
    assessorService.getAssessmentDetail.mockResolvedValue({
      id: 55,
      org_id: 99,
      assessor_user_id: 77,
    });

    await expect(
      controller.getAssessment(55, {
        user: { sub: 2, email: 'assessor@test.com', role: 'ASSESSOR' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
