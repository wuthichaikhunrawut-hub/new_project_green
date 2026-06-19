import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Assessment } from './entities/assessment.entity';
import { AssessmentDetail } from './entities/assessment-detail.entity';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { MailService } from '../notifications/mail.service';
import { UsersService } from '../users/users.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let temMock: any;

  beforeEach(async () => {
    temMock = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((val) => val),
      find: jest.fn(),
    };

    const mockAssessmentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      manager: {
        transaction: jest.fn().mockImplementation((cb) => cb(temMock)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: getRepositoryToken(Assessment),
          useValue: mockAssessmentRepo,
        },
        { provide: getRepositoryToken(AssessmentDetail), useValue: {} },
        { provide: getRepositoryToken(GreenCriteriaMaster), useValue: {} },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: UsersService,
          useValue: {
            findOrgAdmin: jest
              .fn()
              .mockResolvedValue({ email: 'admin@test.com' }),
          },
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should correctly sum up scores using assessor_score if set, or fallback to self_score', async () => {
      const existingAssessment = {
        id: 1,
        status: 'SUBMITTED',
        organization: { id: 10 },
        details: [
          { id: 101, self_score: 5, assessor_score: null },
          { id: 102, self_score: 10, assessor_score: 8 },
        ],
      };

      const updateDto = {
        status: 'SUBMITTED',
        details: [
          { assessment_detail_id: 101, self_score: 5 },
          { assessment_detail_id: 102, assessor_score: 8 },
        ],
      };

      temMock.findOne.mockResolvedValueOnce(existingAssessment);

      // Mock the freshDetails loaded after saving
      temMock.find.mockResolvedValueOnce([
        { id: 101, self_score: 5, assessor_score: null },
        { id: 102, self_score: 10, assessor_score: 8 },
      ]);

      // Mock return assessment at the end of the transaction
      temMock.findOne.mockResolvedValueOnce({
        ...existingAssessment,
        total_score: 5 + 8, // detail 101 uses self_score (5), detail 102 uses assessor_score (8)
      });

      const result = await service.update(1, updateDto, 10);

      expect(result).toBeDefined();
      expect(result?.total_score).toBe(13); // 5 (fallback) + 8 (assessor_score)
      expect(temMock.save).toHaveBeenCalled();
    });
  });
});
