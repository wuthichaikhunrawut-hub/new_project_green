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
import { NotificationsModule } from '../notifications/notifications.module';

import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from './stripe.service';
import { PaymentController } from './payment.controller';
import { UserSubscriptionsController } from './user-subscriptions.controller';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      Invoice,
      Feature,
      FeatureUsageLog,
      OrganizationSubscription,
      PlanFeature,
      Payment,
      Organization,
      User,
    ]),
    AuditLogsModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [
    SubscriptionsController,
    PaymentController,
    UserSubscriptionsController,
    WebhooksController,
  ],
  providers: [SubscriptionsService, StripeService],
  exports: [SubscriptionsService, StripeService],
})
export class SubscriptionsModule {}
