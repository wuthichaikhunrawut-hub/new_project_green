import { Injectable } from '@nestjs/common';
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
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditLogsService: AuditLogsService,
    private notificationsService: NotificationsService,
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
}
