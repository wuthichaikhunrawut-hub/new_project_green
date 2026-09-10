import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GeminiService } from './gemini.service';
import { ChatLog } from './entities/gemini.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

describe('GeminiService', () => {
  let service: GeminiService;
  let mockChatLogRepo: any;
  let mockUserRepo: any;
  let mockOrgRepo: any;

  beforeEach(async () => {
    mockChatLogRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((log) => Promise.resolve(log)),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        organization: { id: 10, name: 'Eco Office' },
      }),
    };

    mockOrgRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 10,
        cached_recommendations: JSON.stringify({
          recommendations: [
            {
              title: 'LED Lights',
              action: 'Switch bulbs',
              expectedImpact: 'High',
            },
          ],
        }),
        last_recommendations_hash: 'mockhash',
      }),
      save: jest.fn().mockImplementation((org) => Promise.resolve(org)),
      manager: {
        query: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        { provide: getRepositoryToken(ChatLog), useValue: mockChatLogRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a chat session object', async () => {
    const session = await service.createSession(1, 'Green Office Chat');
    expect(session).toBeDefined();
    expect(session.title).toBe('Green Office Chat');
    expect(session.user_id).toBe(1);
  });

  it('should delete a chat session', async () => {
    await service.deleteSession(12345, 1);
    expect(mockChatLogRepo.delete).toHaveBeenCalledWith({
      session_id: 12345,
      user_id: 1,
    });
  });
});
