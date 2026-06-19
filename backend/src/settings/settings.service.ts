import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    // Seed default settings if they don't exist
    try {
      await this.seedDefaults();
    } catch (err) {
      console.warn(
        'Could not seed default settings - table might not exist yet:',
        err.message,
      );
    }
  }

  private async seedDefaults() {
    const defaults = {
      defaultBaseYear: '2024',
      systemName: 'GREEN SYNC',
      maintenanceMode: 'false',
      carbonStandard: 'TGO',
      carbonThreshold: '50000',
      'permission.manage_quota': 'System Admin',
      'permission.ai_scan': 'System Admin',
      'permission.green_office': 'System Admin',
      'stripe.public_key': '',
      'stripe.secret_key': '',
      'stripe.webhook_secret': '',
      'stripe.currency': 'thb',
      industry_benchmark: '12000',
      'smtp.mode': 'mock',
      'smtp.host': '',
      'smtp.port': '587',
      'smtp.user': '',
      'smtp.pass': '',
      'smtp.sender': 'Green Office System <no-reply@greensync.com>',
      'smtp.fallback_email': 'admin@greensync.com',
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await this.settingRepo.findOne({ where: { key } });
      if (!existing) {
        await this.settingRepo.save(
          this.settingRepo.create({
            key,
            value,
            description: `Default setting for ${key}`,
          }),
        );
      }
    }
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.settingRepo.find();
    const result: Record<string, any> = {};
    for (const s of settings) {
      // Send masked values for sensitive keys instead of completely skipping or exposing them
      if (
        s.key === 'stripe.secret_key' ||
        s.key === 'stripe.webhook_secret' ||
        s.key === 'smtp.pass'
      ) {
        result[s.key] = s.value ? '••••••••' : '';
        continue;
      }
      result[s.key] = this.parseValue(s.key, s.value);
    }
    return result;
  }

  async getSetting(key: string): Promise<any> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) return null;
    return this.parseValue(key, setting.value);
  }

  private parseValue(key: string, value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (
      !key.startsWith('payment.') &&
      !key.startsWith('stripe.') &&
      !key.startsWith('smtp.') &&
      !isNaN(Number(value)) &&
      value !== ''
    ) {
      return Number(value);
    }
    return value;
  }

  async updateSettings(
    settings: Record<string, any>,
  ): Promise<Record<string, any>> {
    for (const [key, value] of Object.entries(settings)) {
      const valStr = String(value);

      // Skip updating sensitive keys if they are sent as masked values or empty, but only if they already have an existing value
      if (
        (key === 'stripe.secret_key' ||
          key === 'stripe.webhook_secret' ||
          key === 'smtp.pass') &&
        (valStr === '••••••••' || valStr.includes('•') || valStr === '')
      ) {
        const existing = await this.settingRepo.findOne({ where: { key } });
        if (existing && existing.value) {
          continue;
        }
      }

      const existing = await this.settingRepo.findOne({ where: { key } });
      if (existing) {
        existing.value = valStr;
        await this.settingRepo.save(existing);
      } else {
        await this.settingRepo.save(
          this.settingRepo.create({ key, value: valStr }),
        );
      }
    }
    return this.getAllSettings();
  }
}
