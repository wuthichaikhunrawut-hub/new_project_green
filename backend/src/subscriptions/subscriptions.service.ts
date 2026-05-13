import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Invoice } from './entities/invoice.entity';
import { Feature } from './entities/feature.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Feature)
    private featuresRepository: Repository<Feature>,
    private auditLogsService: AuditLogsService,
  ) {}

  // ---- Subscription Plans ----

  findAllPlans() {
    return this.plansRepository.find({ 
      relations: ['features'],
      order: { price_per_month: 'ASC' } 
    });
  }

  findAllFeatures() {
    return this.featuresRepository.find({ order: { feature_name: 'ASC' } });
  }

  async createFeature(data: Partial<Feature>) {
    const feature = this.featuresRepository.create(data);
    const saved = await this.featuresRepository.save(feature);
    await this.auditLogsService.logAction(undefined, 'CREATE_FEATURE', `Created feature: ${saved.feature_name}`);
    return saved;
  }

  async updateFeature(id: number, data: Partial<Feature>) {
    await this.featuresRepository.update(id, data);
    const updated = await this.featuresRepository.findOne({ where: { id } });
    await this.auditLogsService.logAction(undefined, 'UPDATE_FEATURE', `Updated feature: ${updated?.feature_name}`);
    return updated;
  }

  async removeFeature(id: number) {
    const feature = await this.featuresRepository.findOne({ where: { id } });
    await this.featuresRepository.delete(id);
    if (feature) await this.auditLogsService.logAction(undefined, 'DELETE_FEATURE', `Deleted feature: ${feature.feature_name}`);
  }

  async createPlan(data: any) {
    const { feature_ids, ...planData } = data;
    const plan = this.plansRepository.create(planData as any) as any as SubscriptionPlan;
    
    if (feature_ids && feature_ids.length > 0) {
      plan.features = await this.featuresRepository.find({ where: { id: In(feature_ids) } });
    }

    const saved = await this.plansRepository.save(plan);
    await this.auditLogsService.logAction(undefined, 'CREATE_PLAN', `Created subscription plan: ${saved.plan_name}`);
    return saved;
  }

  async updatePlan(id: number, data: any) {
    const { feature_ids, ...planData } = data;
    
    // Use save for updates involving relations
    const plan = await this.plansRepository.findOne({ where: { id }, relations: ['features'] });
    if (!plan) throw new Error('Plan not found');

    Object.assign(plan, planData);

    if (feature_ids) {
      plan.features = await this.featuresRepository.find({ where: { id: In(feature_ids) } });
    }

    const updated = await this.plansRepository.save(plan) as unknown as SubscriptionPlan;
    await this.auditLogsService.logAction(undefined, 'UPDATE_PLAN', `Updated plan: ${updated?.plan_name}`);
    return updated;
  }

  async removePlan(id: number) {
    const plan = await this.plansRepository.findOne({ where: { id } });
    await this.plansRepository.delete(id);
    if (plan) await this.auditLogsService.logAction(undefined, 'DELETE_PLAN', `Deleted plan: ${plan.plan_name}`);
  }

  // ---- Invoices ----

  findAllInvoices() {
    return this.invoicesRepository.find({
      relations: ['organization', 'plan'],
      order: { created_at: 'DESC' },
    });
  }

  async updateInvoiceStatus(id: number, status: string) {
    await this.invoicesRepository.update(id, { status });
    return this.invoicesRepository.findOne({ where: { id }, relations: ['organization', 'plan'] });
  }
}
