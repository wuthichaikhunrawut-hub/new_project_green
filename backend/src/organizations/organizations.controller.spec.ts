import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: {
    findOne: jest.Mock;
    update: jest.Mock;
    findUnit: jest.Mock;
    updateUnit: jest.Mock;
  };

  beforeEach(async () => {
    organizationsService = {
      findOne: jest.fn(),
      update: jest.fn(),
      findUnit: jest.fn(),
      updateUnit: jest.fn(),
    };
    const mockJwtService = {};
    const mockConfigService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: organizationsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows ORG_ADMIN to update its own organization', () => {
    controller.update(
      7,
      { name: 'Updated' },
      {
        user: { role: 'ORG_ADMIN', orgId: 7 },
      },
    );

    expect(organizationsService.update).toHaveBeenCalledWith(7, {
      name: 'Updated',
    });
  });

  it('prevents ORG_ADMIN from updating another organization', () => {
    expect(() =>
      controller.update(
        9,
        { name: 'Blocked' },
        {
          user: { role: 'ORG_ADMIN', orgId: 7 },
        },
      ),
    ).toThrow(ForbiddenException);
    expect(organizationsService.update).not.toHaveBeenCalled();
  });

  it('prevents ORG_ADMIN from updating a unit in another organization', async () => {
    organizationsService.findUnit.mockResolvedValue({ id: 3, org_id: 9 });

    await expect(
      controller.updateUnit(
        3,
        { unit_name: 'Blocked' },
        {
          user: { role: 'ORG_ADMIN', orgId: 7 },
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(organizationsService.updateUnit).not.toHaveBeenCalled();
  });
});
