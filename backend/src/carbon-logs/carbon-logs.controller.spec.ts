import { Test, TestingModule } from '@nestjs/testing';
import { CarbonLogsController } from './carbon-logs.controller';
import { CarbonLogsService } from './carbon-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('CarbonLogsController', () => {
  let controller: CarbonLogsController;

  beforeEach(async () => {
    const mockService = {};
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
});
