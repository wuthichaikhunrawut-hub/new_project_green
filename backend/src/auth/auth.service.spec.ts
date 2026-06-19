import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../notifications/mail.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      getPrimaryRoleForUser: jest.fn().mockResolvedValue('ORG_ADMIN'),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 1, user_profile: { first_name: 'Test' } }),
      update: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: OrganizationsService, useValue: {} },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('test_token') },
        },
        { provide: AuditLogsService, useValue: { logAction: jest.fn() } },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(
        service.login({ email: 'test@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password_hash: await bcrypt.hash('password123', 10),
        organization: { id: 1, name: 'Test Org' },
      };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.access_token).toBe('test_token');
      expect(result.user.email).toBe('test@test.com');
      expect(result.organization?.name).toBe('Test Org');
    });
  });
});
