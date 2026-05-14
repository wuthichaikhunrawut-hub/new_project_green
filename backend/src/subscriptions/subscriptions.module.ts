import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Invoice } from './entities/invoice.entity';
import { Feature } from './entities/feature.entity';
import { FeatureUsageLog } from './entities/feature-usage-log.entity';
import { OrganizationSubscription } from './entities/organization-subscription.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { Payment } from './entities/payment.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan, 
      Invoice,
      Feature,
      FeatureUsageLog,
      OrganizationSubscription,
      PlanFeature,
      Payment
    ]),
    AuditLogsModule,
    SettingsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
