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
        DB_HOST: Joi.string().default('127.0.0.1'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().allow('').default('postgres'),
        DB_NAME: Joi.string().default('project-green'),
        JWT_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(16).required(),
          otherwise: Joi.string().default('dev_jwt_secret_key_12345_greensync'),
        }),
        GEMINI_API_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().required(),
          otherwise: Joi.string().default('mock-gemini-key'),
        }),
        STRIPE_PUBLIC_KEY: Joi.string().optional().allow(''),
        STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
        SUPABASE_URL: Joi.string().default('https://mock.supabase.co'),
        SUPABASE_KEY: Joi.string().default('mock-supabase-key'),
        SUPABASE_BUCKET: Joi.string().default('greensync-storage'),
        SMTP_HOST: Joi.string().default('smtp.example.com'),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().default('mock_user@example.com'),
        SMTP_PASS: Joi.string().default('mock_pass'),
        ALLOWED_ORIGINS: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().default(
            'http://localhost:4200,http://localhost:80',
          ),
        }),
        DB_SYNCHRONIZE: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(true),
        ENABLE_SWAGGER: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
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
        // Development keeps the current fast schema workflow. Production must
        // always use reviewed migrations and can never auto-modify the schema.
        synchronize:
          configService.get<string>('NODE_ENV') !== 'production' &&
          configService.get<boolean>('DB_SYNCHRONIZE', true),
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
