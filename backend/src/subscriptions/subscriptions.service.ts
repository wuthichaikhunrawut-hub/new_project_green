import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Invoice } from './entities/invoice.entity';
import { Feature } from './entities/feature.entity';
import { OrganizationSubscription } from './entities/organization-subscription.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { FeatureUsageLog } from './entities/feature-usage-log.entity';
import { Payment } from './entities/payment.entity';
import { StripeService } from './stripe.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Feature)
    private featuresRepository: Repository<Feature>,
    @InjectRepository(OrganizationSubscription)
    private orgSubRepository: Repository<OrganizationSubscription>,
    @InjectRepository(FeatureUsageLog)
    private usageLogRepository: Repository<FeatureUsageLog>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService,
    private stripeService: StripeService,
    private settingsService: SettingsService,
  ) {}

  // ... (previous methods)

  async getOrganizationByUserId(userId: number): Promise<Organization> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user || !user.organization) {
      throw new Error('Organization not found for user');
    }
    return user.organization;
  }

  async updateOrganizationStripeId(orgId: number, stripeId: string) {
    await this.orgRepository.update(orgId, { stripe_customer_id: stripeId });
  }

  async getOrganizationByStripeCustomerId(stripeId: string): Promise<Organization | null> {
    return this.orgRepository.findOne({ where: { stripe_customer_id: stripeId } });
  }

  // ---- Stripe Webhook Handlers ----

  async handleStripeWebhook(signature: string, payload: Buffer) {
    try {
      const event = await this.stripeService.constructEvent(payload, signature);
      console.log('Stripe Webhook Event Received:', event.type);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChange(event.data.object);
          break;
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
      }
      return { received: true };
    } catch (err: any) {
      console.error('Stripe Webhook Error:', err.message);
      return { received: false, error: err.message };
    }
  }

  async handleInvoicePaymentSucceeded(invoice: any) {
    const org = await this.getOrganizationByStripeCustomerId(invoice.customer);
    if (!org) return;
    
    console.log(`Payment succeeded for org ${org.name}, amount: ${invoice.amount_paid}`);
    
    await this.createPaymentRecord({
      org_id: org.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      payment_method: 'stripe',
      payment_status: 'PAID',
      paid_at: new Date(),
    });
  }

  async handleInvoicePaymentFailed(invoice: any) {
    const org = await this.getOrganizationByStripeCustomerId(invoice.customer);
    if (!org) return;
    console.log(`Payment failed for org ${org.name}`);
  }

  async handleSubscriptionChange(subscription: any) {
    const org = await this.getOrganizationByStripeCustomerId(subscription.customer);
    if (!org) return;
    console.log(`Subscription ${subscription.status} for org ${org.name}`);
    const activeSub = await this.orgSubRepository.findOne({ where: { org_id: org.id } });
    if (activeSub) {
      activeSub.status = subscription.status === 'active' || subscription.status === 'trialing' ? 'ACTIVE' : 'EXPIRED';
      activeSub.end_date = new Date(subscription.current_period_end * 1000);
      await this.orgSubRepository.save(activeSub);
    }
  }

  async handleCheckoutSessionCompleted(session: any) {
    const org = await this.getOrganizationByStripeCustomerId(session.customer);
    if (!org) return;
    console.log(`Checkout completed for org ${org.name}`);
  }

  // ---- Subscription Plans ----

  findAllPlans() {
    return this.plansRepository.find({
      relations: ['features'],
      order: { price_per_month: 'ASC' },
    });
  }

  findAllFeatures() {
    return this.featuresRepository.find({ order: { feature_name: 'ASC' } });
  }

  async createFeature(data: Partial<Feature>) {
    const feature = this.featuresRepository.create(data);
    const saved = await this.featuresRepository.save(feature);
    await this.auditLogsService.logAction(
      undefined,
      'CREATE_FEATURE',
      `Created feature: ${saved.feature_name}`,
    );
    return saved;
  }

  async updateFeature(id: number, data: Partial<Feature>) {
    await this.featuresRepository.update(id, data);
    const updated = await this.featuresRepository.findOne({ where: { id } });
    await this.auditLogsService.logAction(
      undefined,
      'UPDATE_FEATURE',
      `Updated feature: ${updated?.feature_name}`,
    );
    return updated;
  }

  async removeFeature(id: number) {
    const feature = await this.featuresRepository.findOne({ where: { id } });
    await this.featuresRepository.delete(id);
    if (feature)
      await this.auditLogsService.logAction(
        undefined,
        'DELETE_FEATURE',
        `Deleted feature: ${feature.feature_name}`,
      );
  }

  async createPlan(data: any) {
    const { feature_ids, ...planData } = data;
    const plan = this.plansRepository.create(
      planData,
    ) as any as SubscriptionPlan;

    if (feature_ids && feature_ids.length > 0) {
      plan.features = await this.featuresRepository.find({
        where: { id: In(feature_ids) },
      });
    }

    const saved = await this.plansRepository.save(plan);
    await this.auditLogsService.logAction(
      undefined,
      'CREATE_PLAN',
      `Created subscription plan: ${saved.plan_name}`,
    );
    return saved;
  }

  async updatePlan(id: number, data: any) {
    const { feature_ids, ...planData } = data;

    // Use save for updates involving relations
    const plan = await this.plansRepository.findOne({
      where: { id },
      relations: ['features'],
    });
    if (!plan) throw new Error('Plan not found');

    Object.assign(plan, planData);

    if (feature_ids) {
      plan.features = await this.featuresRepository.find({
        where: { id: In(feature_ids) },
      });
    }

    const updated = (await this.plansRepository.save(
      plan,
    )) as unknown as SubscriptionPlan;
    await this.auditLogsService.logAction(
      undefined,
      'UPDATE_PLAN',
      `Updated plan: ${updated?.plan_name}`,
    );
    return updated;
  }

  async removePlan(id: number) {
    const plan = await this.plansRepository.findOne({ where: { id } });
    await this.plansRepository.delete(id);
    if (plan)
      await this.auditLogsService.logAction(
        undefined,
        'DELETE_PLAN',
        `Deleted plan: ${plan.plan_name}`,
      );
  }

  // ---- Invoices ----

  findAllInvoices() {
    return this.invoicesRepository.find({
      relations: ['organization', 'plan'],
      order: { created_at: 'DESC' },
    });
  }

  async updateInvoiceStatus(id: number, status: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['organization', 'plan'],
    });
    if (!invoice) throw new Error('Invoice not found');

    await this.invoicesRepository.update(id, { status });
    const updated = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['organization', 'plan'],
    });

    await this.auditLogsService.logAction(
      undefined,
      'UPDATE_INVOICE',
      `Updated invoice ${invoice.reference_number} status to ${status}`,
    );

    if (status === 'PAID') {
      await this.recordPaymentForInvoice(id, 'PAID');
    }

    // If marked as PAID, notify the organization
    if (status === 'PAID' && invoice.organization) {
      // Find the admin user of this organization (Simplified: just find any user in the org)
      const user = await this.userRepository.findOne({
        where: { organization: { id: invoice.organization.id } },
      });
      if (user) {
        await this.notificationsService.create({
          title: 'ชำระเงินเรียบร้อยแล้ว',
          message: `ใบแจ้งหนี้เลขที่ ${invoice.reference_number} สำหรับแพ็กเกจ ${invoice.plan?.plan_name} ได้รับการยืนยันแล้ว`,
          type: NotificationType.SYSTEM,
          recipient_id: user.id,
          link: '/org/subscriptions',
        });
      }
    }

    return updated;
  }

  // ---- Feature Access Enforcement ----

  async findOrgSubscription(orgId: number) {
    return this.orgSubRepository.findOne({
      where: { org_id: orgId, status: 'ACTIVE' },
      relations: ['plan', 'plan.features'],
    });
  }

  async canAccessFeature(orgId: number, featureCode: string): Promise<boolean> {
    const sub = await this.findOrgSubscription(orgId);
    if (!sub || !sub.plan) return false;

    return sub.plan.features?.some(
      (f) => f.feature_code.toLowerCase() === featureCode.toLowerCase(),
    );
  }

  async getQuotaLimit(planId: number, featureCode: string): Promise<number> {
    const key = `quota.plan:${planId}.feat:${featureCode.toLowerCase()}`;
    const value = await this.settingsService.getSetting(key);
    if (value !== null && value !== undefined && value !== '') {
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        return parsed; // return actual limit (0 = unlimited)
      }
    }
    
    // Default fallbacks if not defined:
    if (featureCode.toUpperCase() === 'AI_SCAN') {
      if (planId === 3) return 20;
      if (planId === 36) return 50;
      return 0; // Super/others unlimited
    }
    if (featureCode.toUpperCase() === 'AI_ASSISTANCE') {
      if (planId === 3) return 5;
      if (planId === 36) return 100;
      return 0;
    }
    return 0;
  }

  async checkFeatureQuota(
    orgId: number,
    featureCode: string,
  ): Promise<{ allowed: boolean; used: number; limit: number }> {
    const sub = await this.findOrgSubscription(orgId);
    if (!sub || !sub.plan) return { allowed: false, used: 0, limit: 0 };

    const limit = await this.getQuotaLimit(sub.plan.id, featureCode);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const log = await this.usageLogRepository.findOne({
      where: {
        org_id: orgId,
        feature_code: featureCode.toUpperCase(),
        usage_month: month,
        usage_year: year,
      },
    });

    const used = log ? log.usage_count : 0;

    return {
      allowed: (limit === 0 || limit >= 999999) ? true : used < limit,
      used,
      limit,
    };
  }

  async logFeatureUsage(
    orgId: number,
    featureCode: string,
    amount: number = 1,
  ): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let log = await this.usageLogRepository.findOne({
      where: {
        org_id: orgId,
        feature_code: featureCode.toUpperCase(),
        usage_month: month,
        usage_year: year,
      },
    });

    if (log) {
      log.usage_count += amount;
      await this.usageLogRepository.save(log);
    } else {
      log = this.usageLogRepository.create({
        org_id: orgId,
        feature_code: featureCode.toUpperCase(),
        usage_count: amount,
        usage_month: month,
        usage_year: year,
      });
      await this.usageLogRepository.save(log);
    }
  }

  async getFeatureUsageLogs(orgId: number, month?: number, year?: number) {
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    return this.usageLogRepository.find({
      where: { org_id: orgId, usage_month: m, usage_year: y },
      order: { feature_code: 'ASC' },
    });
  }

  async getOrganizationFeatureQuotaSummary(orgId: number) {
    const sub = await this.findOrgSubscription(orgId);
    if (!sub || !sub.plan || !sub.plan.features) {
      return [];
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const logs = await this.usageLogRepository.find({
      where: { org_id: orgId, usage_month: month, usage_year: year },
    });

    const quotaPromises = sub.plan.features.map(async (feature) => {
      const limit = await this.getQuotaLimit(
        sub.plan.id,
        feature.feature_code,
      );
      const log = logs.find(
        (entry) => entry.feature_code.toUpperCase() === feature.feature_code.toUpperCase(),
      );
      return {
        feature_code: feature.feature_code.toUpperCase(),
        feature_name: feature.feature_name,
        used: log?.usage_count ?? 0,
        limit,
        allowed: (limit === 0 || limit >= 999999) ? true : (log?.usage_count ?? 0) < limit,
      };
    });

    return Promise.all(quotaPromises);
  }

  async getOrganizationPayments(orgId: number) {
    return this.paymentRepository.find({
      where: { org_id: orgId },
      order: { paid_at: 'DESC', created_at: 'DESC' },
    });
  }

  async createPaymentRecord(data: Partial<Payment>) {
    const payment = this.paymentRepository.create(data);
    return this.paymentRepository.save(payment);
  }

  async cancelSubscription(orgId: number) {
    const sub = await this.orgSubRepository.findOne({ where: { org_id: orgId, status: 'ACTIVE' } });
    if (!sub) throw new Error('No active subscription found');
    
    // In a real production app, also cancel on Stripe via Stripe API
    sub.auto_renew = false;
    sub.status = 'CANCELLED';
    await this.orgSubRepository.save(sub);
    
    await this.auditLogsService.logAction(
      undefined,
      'CANCEL_SUBSCRIPTION',
      `Organization ${orgId} cancelled their subscription`,
    );
    
    return { success: true, message: 'Subscription cancelled successfully' };
  }

  async recordPaymentForInvoice(invoiceId: number, status: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const existingPayment = await this.paymentRepository.findOne({
      where: { invoice_id: invoiceId },
    });

    const paymentData: Partial<Payment> = {
      invoice_id: invoiceId,
      org_id: invoice.org_id,
      amount: invoice.amount ?? 0,
      currency: 'THB',
      payment_method: 'stripe',
      payment_status: status,
      paid_at: status === 'PAID' ? new Date() : undefined,
    };

    if (existingPayment) {
      await this.paymentRepository.update(existingPayment.id, paymentData);
      return this.paymentRepository.findOne({
        where: { id: existingPayment.id },
      });
    }

    return this.createPaymentRecord(paymentData);
  }

  async subscribeToPlan(orgId: number, planId: number) {
    const plan = await this.plansRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    if (plan.price_per_month > 0) {
      throw new BadRequestException('Cannot subscribe directly to a paid plan without payment info');
    }

    let existingSub = await this.orgSubRepository.findOne({
      where: { org_id: orgId, status: 'ACTIVE' },
    });

    if (existingSub) {
      existingSub.status = 'CANCELLED';
      await this.orgSubRepository.save(existingSub);
    }

    const newSub = this.orgSubRepository.create({
      org_id: orgId,
      plan_id: planId,
      status: 'ACTIVE',
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      auto_renew: true,
    });

    const savedSub = await this.orgSubRepository.save(newSub);

    await this.auditLogsService.logAction(
      undefined,
      'SUBSCRIBE_PLAN',
      `Organization ${orgId} subscribed to free plan: ${plan.plan_name}`,
    );

    return {
      success: true,
      message: 'Subscribed to plan successfully',
      subscription: savedSub,
    };
  }

  async getUserSubscriptionStatusByUserId(userId: number) {
    const org = await this.getOrganizationByUserId(userId);
    const sub = await this.findOrgSubscription(org.id);
    const quotas = await this.getOrganizationFeatureQuotaSummary(org.id);

    // ดึงค่า AI_SCAN quota
    const aiQuota = quotas.find((q) => q.feature_code === 'AI_SCAN') || {
      used: 0,
      limit: 0,
    };

    return {
      planName: sub?.plan?.plan_name || 'Free Plan',
      aiScanLimit: aiQuota.limit,
      aiScanUsed: aiQuota.used,
      expiryDate: sub?.end_date,
    };
  }
}
