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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: getRepositoryToken(Assessment), useValue: {} },
        { provide: getRepositoryToken(AssessmentDetail), useValue: {} },
        { provide: getRepositoryToken(GreenCriteriaMaster), useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
