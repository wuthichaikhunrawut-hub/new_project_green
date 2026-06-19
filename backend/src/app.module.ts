import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GeminiModule } from './gemini/gemini.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CarbonLogsModule } from './carbon-logs/carbon-logs.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UploadsModule } from './uploads/uploads.module';
import { SettingsModule } from './settings/settings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AssessorModule } from './assessor/assessor.module';
import { OrgAdminModule } from './org-admin/org-admin.module';
import { ExecutiveModule } from './executive/executive.module';
import { AssessorAdminModule } from './assessor-admin/assessor-admin.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import * as Joi from 'joi';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Limit each IP to 100 requests per 60 seconds
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3001),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        GEMINI_API_KEY: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().optional(),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_KEY: Joi.string().required(),
        SUPABASE_BUCKET: Joi.string().default('greensync-storage'),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'greenoffice'),
        autoLoadEntities: true,
        synchronize: true, // Auto-create tables from entities
        logging: false,
      }),
    }),
    GeminiModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    CarbonLogsModule,
    AssessmentsModule,
    AuditLogsModule,
    SubscriptionsModule,
    UploadsModule,
    SettingsModule,
    AnalyticsModule,
    NotificationsModule,
    AssessorModule,
    OrgAdminModule,
    ExecutiveModule,
    AssessorAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
