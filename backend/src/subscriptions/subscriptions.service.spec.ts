import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Invoice } from './entities/invoice.entity';
import { Feature } from './entities/feature.entity';
import { OrganizationSubscription } from './entities/organization-subscription.entity';
import { FeatureUsageLog } from './entities/feature-usage-log.entity';
import { Payment } from './entities/payment.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeService } from './stripe.service';
import { SettingsService } from '../settings/settings.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockInvoiceRepo: any;
  let mockPlanRepo: any;
  let mockUserRepo: any;
  let mockSettingsService: { getSetting: jest.Mock };

  beforeEach(async () => {
    mockInvoiceRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 1, invoice_number: 'INV-001', amount: 5000 },
        ]),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        invoice_number: 'INV-001',
        amount: 5000,
        status: 'PENDING',
      }),
      save: jest.fn().mockImplementation((inv) => Promise.resolve(inv)),
    };

    mockPlanRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 1, plan_name: 'Enterprise', price_per_month: 9900 },
        ]),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        plan_name: 'Enterprise',
        price_per_month: 9900,
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        organization: { id: 10, name: 'Green Corp' },
      }),
    };
    mockSettingsService = { getSetting: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepo,
        },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(Feature), useValue: {} },
        { provide: getRepositoryToken(OrganizationSubscription), useValue: {} },
        { provide: getRepositoryToken(FeatureUsageLog), useValue: {} },
        { provide: getRepositoryToken(Payment), useValue: {} },
        { provide: getRepositoryToken(Organization), useValue: {} },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: AuditLogsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: StripeService, useValue: {} },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should find all plans', async () => {
    const plans = await service.findAllPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].plan_name).toBe('Enterprise');
    expect(mockPlanRepo.find).toHaveBeenCalledWith({
      where: { is_active: true },
      relations: ['features'],
      order: { price_per_month: 'ASC' },
    });
  });

  it('should find invoices with pagination', () => {
    service.findAllInvoices(2, 10);
    expect(mockInvoiceRepo.find).toHaveBeenCalledWith({
      relations: ['organization', 'plan'],
      order: { created_at: 'DESC' },
      skip: 10,
      take: 10,
    });
  });

  it('should get organization for user', async () => {
    const org = await service.getOrganizationByUserId(1);
    expect(org.name).toBe('Green Corp');
  });

  it('does not infer quota from environment-specific plan IDs', async () => {
    await expect(service.getQuotaLimit(36, 'AI_SCAN')).resolves.toBe(0);
    expect(mockSettingsService.getSetting).toHaveBeenCalledWith(
      'quota.plan:36.feat:ai_scan',
    );
  });
});
