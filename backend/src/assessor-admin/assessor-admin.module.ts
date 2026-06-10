import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessorAdminController } from './assessor-admin.controller';
import { AssessorAdminService } from './assessor-admin.service';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { User } from '../users/entities/user.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessorProfile } from '../users/entities/assessor-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Assessment, AssessorProfile]),
    UsersModule,
    SubscriptionsModule,
  ],
  controllers: [AssessorAdminController],
  providers: [AssessorAdminService],
})
export class AssessorAdminModule {}
