import { Test, TestingModule } from '@nestjs/testing';
import { CarbonLogsService } from './carbon-logs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CarbonLog } from './entities/carbon-log.entity';
import { EmissionFactor } from './entities/emission-factor.entity';

describe('CarbonLogsService', () => {
  let service: CarbonLogsService;
  let logRepo: any;

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((log) => ({ id: 123, ...log })),
      manager: {
        findOne: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarbonLogsService,
        { provide: getRepositoryToken(CarbonLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CarbonLogsService>(CarbonLogsService);
    logRepo = module.get(getRepositoryToken(CarbonLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should correctly calculate total_emission using emission factor factor_value', async () => {
      const createDto = {
        activity_type: 'Electricity',
        emission_factor_id: 1,
        usage_amount: 150,
        year: 2026,
        month: 6,
      };

      // Mock the emission factor retrieval
      logRepo.manager.findOne.mockResolvedValue({
        id: 1,
        factor_value: 0.5271, // e.g. electricity conversion factor
      });

      // Mock the saved log retrieval
      logRepo.findOne.mockResolvedValue({
        id: 123,
        ...createDto,
        total_emission: 150 * 0.5271,
      });

      const result = await service.create(createDto, 1);

      expect(logRepo.manager.findOne).toHaveBeenCalledWith(EmissionFactor, {
        where: { id: 1 },
      });
      expect(result.total_emission).toBeCloseTo(79.065, 4);
    });
  });

  describe('update', () => {
    it('should correctly recalculate total_emission when updating usage_amount', async () => {
      const existingLog = {
        id: 123,
        org_id: 1,
        emission_factor_id: 1,
        usage_amount: 100,
        total_emission: 50,
      };

      const updateDto = {
        usage_amount: 200,
      };

      logRepo.findOne
        // First call: load existing
        .mockResolvedValueOnce(existingLog)
        // Second call: return updated log
        .mockResolvedValueOnce({
          ...existingLog,
          usage_amount: 200,
          total_emission: 200 * 0.5271,
        });

      logRepo.manager.findOne.mockResolvedValue({
        id: 1,
        factor_value: 0.5271,
      });

      const result = await service.update(123, 1, updateDto);

      expect(result.total_emission).toBeCloseTo(105.42, 4);
      expect(logRepo.save).toHaveBeenCalled();
    });
  });
});
