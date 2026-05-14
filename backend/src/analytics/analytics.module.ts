import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Invoice } from '../subscriptions/entities/invoice.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { OrganizationSubscription } from '../subscriptions/entities/organization-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { AssessorProfile } from '../users/entities/assessor-profile.entity';

import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, Invoice, Assessment, OrganizationSubscription, SubscriptionPlan, AssessorProfile]),
    SettingsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
