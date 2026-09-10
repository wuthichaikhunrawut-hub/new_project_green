import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import * as fs from 'fs';
import * as path from 'path';

describe('SettingsService', () => {
  let service: SettingsService;
  const testDataDir = path.resolve(process.cwd(), 'data-test');
  const testFilePath = path.resolve(testDataDir, 'admin_settings_test.json');

  beforeAll(() => {
    process.env.SETTINGS_FILE_PATH = testFilePath;
  });

  afterAll(() => {
    delete process.env.SETTINGS_FILE_PATH;
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmdirSync(testDataDir);
    }
  });

  beforeEach(async () => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    service.onModuleInit();
  });

  it('should be defined and load default settings', async () => {
    expect(service).toBeDefined();
    const systemName = await service.getSetting('systemName');
    expect(systemName).toBe('GREEN SYNC');
  });

  it('should parse boolean and number values correctly', async () => {
    expect(await service.getSetting('maintenanceMode')).toBe(false);
    expect(await service.getSetting('carbonThreshold')).toBe(50000);
  });

  it('should mask sensitive settings in getAllSettings', async () => {
    await service.updateSettings({
      'stripe.secret_key': 'sk_test_secret_123',
    });

    const all = await service.getAllSettings();
    expect(all['stripe.secret_key']).toBe('••••••••');
  });

  it('should persist settings to file on update and restore on restart', async () => {
    await service.updateSettings({
      carbonThreshold: 65000,
      customKey: 'customValue',
    });

    expect(fs.existsSync(testFilePath)).toBe(true);

    const newService = new SettingsService();
    newService.onModuleInit();

    const threshold = await newService.getSetting('carbonThreshold');
    const custom = await newService.getSetting('customKey');

    expect(threshold).toBe(65000);
    expect(custom).toBe('customValue');
  });
});
