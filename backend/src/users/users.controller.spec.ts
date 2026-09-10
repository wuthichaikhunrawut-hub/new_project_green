import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const mockJwtService = {};
    const mockConfigService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forces newly created users into the ORG_ADMIN organization', async () => {
    usersService.create.mockResolvedValue({ id: 10 });

    await controller.create(
      { email: 'employee@example.com', role: 'EMPLOYEE' },
      { user: { role: 'ORG_ADMIN', orgId: 7 } },
    );

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ organization: { id: 7 } }),
    );
  });

  it('prevents ORG_ADMIN from creating a SYSTEM_ADMIN', () => {
    expect(() =>
      controller.create(
        { email: 'admin@example.com', role: 'SYSTEM_ADMIN' },
        { user: { role: 'ORG_ADMIN', orgId: 7 } },
      ),
    ).toThrow(ForbiddenException);
  });

  it('prevents ORG_ADMIN from reading a user in another organization', async () => {
    usersService.findOne.mockResolvedValue({
      id: 12,
      organization: { id: 9 },
    });

    await expect(
      controller.findOne('12', {
        user: { role: 'ORG_ADMIN', orgId: 7 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('routes personal profile updates through updateProfileOnly', async () => {
    (usersService as any).updateProfileOnly = jest
      .fn()
      .mockResolvedValue({ id: 5 });

    await controller.updateProfile(
      { user: { sub: 5 } },
      { first_name: 'Green', last_name: 'Tester' },
    );

    expect((usersService as any).updateProfileOnly).toHaveBeenCalledWith(5, {
      first_name: 'Green',
      last_name: 'Tester',
    });
  });
});
