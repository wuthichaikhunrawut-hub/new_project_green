import { Test, TestingModule } from '@nestjs/testing';
import { CarbonLogsController } from './carbon-logs.controller';
import { CarbonLogsService } from './carbon-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('CarbonLogsController', () => {
  let controller: CarbonLogsController;
  let mockService: { findAll: jest.Mock };

  beforeEach(async () => {
    mockService = { findAll: jest.fn() };
    const mockJwtService = {};
    const mockConfigService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbonLogsController],
      providers: [
        { provide: CarbonLogsService, useValue: mockService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CarbonLogsController>(CarbonLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses the JWT organization and ignores a spoofed header for ORG_ADMIN', () => {
    controller.findAll({
      user: { role: 'ORG_ADMIN', orgId: 7 },
      headers: { 'x-org-id': '99' },
    });

    expect(mockService.findAll).toHaveBeenCalledWith(7);
  });
});
