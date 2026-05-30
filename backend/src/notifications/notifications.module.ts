import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { MailService } from './mail.service';
import { CarbonLogsModule } from '../carbon-logs/carbon-logs.module';
import { AssessmentsModule } from '../assessments/assessments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UsersModule,
    CarbonLogsModule,
    AssessmentsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, MailService],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}
