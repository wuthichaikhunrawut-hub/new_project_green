import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
        database: configService.get<string>('DB_NAME', 'project_green'),
        autoLoadEntities: true,
        synchronize: true, // Set to false in production
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
