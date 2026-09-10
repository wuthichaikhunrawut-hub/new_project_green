import { Test, TestingModule } from '@nestjs/testing';
import { GreenOfficeController } from './green-office.controller';
import { GreenCriteriaService } from './green-criteria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('GreenOfficeController organization isolation', () => {
  let controller: GreenOfficeController;
  let service: { findAllForFrontend: jest.Mock; updateScore: jest.Mock };

  beforeEach(async () => {
    service = {
      findAllForFrontend: jest.fn().mockResolvedValue([]),
      updateScore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreenOfficeController],
      providers: [{ provide: GreenCriteriaService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GreenOfficeController);
  });

  it('uses the JWT organization for ORG_ADMIN and ignores a spoofed header', async () => {
    await controller.findAll({
      user: { role: 'ORG_ADMIN', orgId: 7 },
      headers: { 'x-org-id': '99' },
    });

    expect(service.findAllForFrontend).toHaveBeenCalledWith(7);
  });

  it('allows SYSTEM_ADMIN to select an organization through the header', async () => {
    await controller.findAll({
      user: { role: 'SYSTEM_ADMIN' },
      headers: { 'x-org-id': '99' },
    });

    expect(service.findAllForFrontend).toHaveBeenCalledWith(99);
  });
});
