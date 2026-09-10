import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('AssessmentsController authorization', () => {
  let controller: AssessmentsController;
  let assessmentsService: {
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    assessmentsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [
        { provide: AssessmentsService, useValue: assessmentsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AssessmentsController);
  });

  it('allows an assessor to read its assigned assessment', async () => {
    assessmentsService.findOne.mockResolvedValue({
      id: 5,
      assessor_user_id: 12,
    });

    await expect(
      controller.findOne(5, { user: { role: 'ASSESSOR', sub: 12 } }),
    ).resolves.toEqual(expect.objectContaining({ id: 5 }));
  });

  it('uses the JWT organization and ignores a spoofed header for ORG_ADMIN', () => {
    controller.create({} as never, {
      user: { role: 'ORG_ADMIN', orgId: 7 },
      headers: { 'x-org-id': '99' },
    });

    expect(assessmentsService.create).toHaveBeenCalledWith({}, 7);
  });

  it('prevents an assessor from reading another assessor assignment', async () => {
    assessmentsService.findOne.mockResolvedValue({
      id: 5,
      assessor_user_id: 99,
    });

    await expect(
      controller.findOne(5, { user: { role: 'ASSESSOR', sub: 12 } }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents an assessor from updating another assessor assignment', async () => {
    assessmentsService.findOne.mockResolvedValue({
      id: 5,
      assessor_user_id: 99,
    });

    await expect(
      controller.update(
        5,
        { status: 'APPROVED' },
        { user: { role: 'ASSESSOR', sub: 12 } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assessmentsService.update).not.toHaveBeenCalled();
  });
});
