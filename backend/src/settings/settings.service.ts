import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private settingsMap = new Map<string, string>();
  private readonly storageFilePath =
    process.env.SETTINGS_FILE_PATH ||
    path.resolve(process.cwd(), 'data', 'admin_settings.json');

  constructor(@Optional() private readonly dataSource?: DataSource) {}

  onModuleInit() {
    this.seedDefaults();
    this.loadFromFile();
    this.initDatabaseStorage().catch(() => {});
  }

  private async initDatabaseStorage() {
    if (!this.dataSource || !this.dataSource.isInitialized) return;

    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "system_settings" (
          "key" varchar(100) PRIMARY KEY,
          "value" text,
          "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const rows = await this.dataSource.query(
        'SELECT "key", "value" FROM "system_settings"',
      );
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (row.key && row.value !== null && row.value !== undefined) {
            this.settingsMap.set(row.key, String(row.value));
          }
        }
        this.logger.log(
          `Loaded ${rows.length} settings from database table system_settings`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Database settings storage initialization skipped/failed: ${err.message}`,
      );
    }
  }

  private seedDefaults() {
    const defaults = {
      defaultBaseYear: process.env.DEFAULT_BASE_YEAR || '2024',
      systemName: process.env.SYSTEM_NAME || 'GREEN SYNC',
      maintenanceMode: process.env.MAINTENANCE_MODE || 'false',
      carbonStandard: process.env.CARBON_STANDARD || 'TGO',
      carbonThreshold: process.env.CARBON_THRESHOLD || '50000',
      'permission.manage_quota': 'System Admin',
      'permission.ai_scan': 'System Admin',
      'permission.green_office': 'System Admin',
      'stripe.public_key': process.env.STRIPE_PUBLIC_KEY || '',
      'stripe.secret_key': process.env.STRIPE_SECRET_KEY || '',
      'stripe.webhook_secret': process.env.STRIPE_WEBHOOK_SECRET || '',
      'stripe.currency': 'thb',
      industry_benchmark: process.env.INDUSTRY_BENCHMARK || '12000',
      'smtp.mode':
        process.env.SMTP_MODE ||
        (process.env.NODE_ENV === 'production' ? 'live' : 'mock'),
      'smtp.host': process.env.SMTP_HOST || '',
      'smtp.port': process.env.SMTP_PORT || '587',
      'smtp.user': process.env.SMTP_USER || '',
      'smtp.pass': process.env.SMTP_PASS || '',
      'smtp.sender': 'Green Office System <no-reply@greensync.com>',
      'smtp.fallback_email': 'admin@greensync.com',
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.settingsMap.set(key, value);
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf8');
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, value] of Object.entries(parsed)) {
            if (value !== undefined && value !== null) {
              const valStr =
                typeof value === 'string'
                  ? value
                  : typeof value === 'number' || typeof value === 'boolean'
                    ? `${value}`
                    : JSON.stringify(value);
              this.settingsMap.set(key, valStr);
            }
          }
          this.logger.log(
            `Loaded ${Object.keys(parsed).length} persistent settings from ${this.storageFilePath}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to load persistent settings from ${this.storageFilePath}: ${err.message}`,
      );
    }
  }

  private async saveToDatabase(key: string, value: string) {
    if (!this.dataSource || !this.dataSource.isInitialized) return;
    try {
      await this.dataSource.query(
        `
        INSERT INTO "system_settings" ("key", "value", "updated_at")
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED.value, "updated_at" = CURRENT_TIMESTAMP
      `,
        [key, value],
      );
    } catch (err) {
      this.logger.warn(
        `Failed to persist setting '${key}' to database: ${err.message}`,
      );
    }
  }

  private saveToFile() {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: Record<string, string> = {};
      for (const [key, value] of this.settingsMap.entries()) {
        data[key] = value;
      }
      fs.writeFileSync(
        this.storageFilePath,
        JSON.stringify(data, null, 2),
        'utf8',
      );
      this.logger.log(`Persisted settings to ${this.storageFilePath}`);
    } catch (err) {
      this.logger.error(
        `Failed to persist settings to ${this.storageFilePath}: ${err.message}`,
      );
    }
  }

  getAllSettings(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.settingsMap.entries()) {
      if (
        key === 'stripe.secret_key' ||
        key === 'stripe.webhook_secret' ||
        key === 'smtp.pass'
      ) {
        result[key] = value ? '••••••••' : '';
        continue;
      }
      result[key] = this.parseValue(key, value);
    }
    return Promise.resolve(result);
  }

  getSetting(key: string): Promise<any> {
    const value = this.settingsMap.get(key);
    if (value === undefined) return Promise.resolve(null);
    return Promise.resolve(this.parseValue(key, value));
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

      if (
        (key === 'stripe.secret_key' ||
          key === 'stripe.webhook_secret' ||
          key === 'smtp.pass') &&
        (valStr === '••••••••' || valStr.includes('•') || valStr === '')
      ) {
        const existing = this.settingsMap.get(key);
        if (existing) {
          continue;
        }
      }

      this.settingsMap.set(key, valStr);
      await this.saveToDatabase(key, valStr);
    }
    this.saveToFile();
    return this.getAllSettings();
  }
}
