import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';
import { UploadsService } from './uploads.service';

describe('UploadsService organization ownership', () => {
  let service: UploadsService;
  let repository: { findOne: jest.Mock; manager: { findOne: jest.Mock } };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      manager: { findOne: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                SUPABASE_URL: 'https://example.supabase.co',
                SUPABASE_KEY: 'test-anon-key',
                SUPABASE_BUCKET: 'test-bucket',
              };
              return values[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(EvidenceFile),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(UploadsService);
  });

  it('allows an organization member to read evidence from its organization', async () => {
    const file = {
      id: 1,
      uploaded_by: { organization: { id: 7 } },
    };
    repository.findOne.mockResolvedValue(file);

    await expect(
      service.findOne(1, { role: 'EMPLOYEE', orgId: 7 }),
    ).resolves.toBe(file);
  });

  it('prevents an organization member from reading evidence from another organization', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      uploaded_by: { organization: { id: 9 } },
    });

    await expect(
      service.findOne(1, { role: 'EMPLOYEE', orgId: 7 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
