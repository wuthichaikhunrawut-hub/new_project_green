import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../settings/settings.service';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let settingsService: SettingsService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
  };

  const mockSettingsService = {
    getAllSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return false if there is no user in request', async () => {
      const context = createMockContext(undefined);
      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should return false if user has no role', async () => {
      const context = createMockContext({ orgId: 1 });
      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should allow access if no roles are required and no feature code is specified', async () => {
      const context = createMockContext({ role: 'ORG_ADMIN' });
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access if user has one of the required roles', async () => {
      const context = createMockContext({ role: 'ORG_ADMIN' });
      mockReflector.getAllAndOverride.mockReturnValue([
        'ORG_ADMIN',
        'SYSTEM_ADMIN',
      ]);
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access for assessor admin when assessor role is required', async () => {
      const context = createMockContext({ role: 'ASSESSOR_ADMIN' });
      mockReflector.getAllAndOverride.mockReturnValue(['ASSESSOR']);
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access if user role is not in the required roles', async () => {
      const context = createMockContext({ role: 'USER' });
      mockReflector.getAllAndOverride.mockReturnValue(['ORG_ADMIN']);
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should allow access based on dynamic settings permission key', async () => {
      const context = createMockContext({ role: 'ORG_ADMIN' });
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockReflector.get.mockReturnValue('AI_SCAN');
      mockSettingsService.getAllSettings.mockResolvedValue({
        'permission.ai_scan': '["ORG_ADMIN"]',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access based on dynamic settings string format', async () => {
      const context = createMockContext({ role: 'ORG_ADMIN' });
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockReflector.get.mockReturnValue('AI_SCAN');
      mockSettingsService.getAllSettings.mockResolvedValue({
        'permission.ai_scan': 'ORG_ADMIN',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access if user role is not in dynamic settings', async () => {
      const context = createMockContext({ role: 'USER' });
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockReflector.get.mockReturnValue('AI_SCAN');
      mockSettingsService.getAllSettings.mockResolvedValue({
        'permission.ai_scan': '["ORG_ADMIN"]',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
    });
  });
});
