import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('PaymentController external-boundary behavior', () => {
  let controller: PaymentController;
  let stripeService: {
    createCustomer: jest.Mock;
    createSetupIntent: jest.Mock;
    getPaymentMethod: jest.Mock;
    detachPaymentMethod: jest.Mock;
  };
  let subscriptionsService: {
    handleStripeWebhook: jest.Mock;
    getOrganizationByUserId: jest.Mock;
    updateOrganizationStripeId: jest.Mock;
  };

  beforeEach(async () => {
    stripeService = {
      createCustomer: jest.fn(),
      createSetupIntent: jest.fn(),
      getPaymentMethod: jest.fn(),
      detachPaymentMethod: jest.fn(),
    };
    subscriptionsService = {
      handleStripeWebhook: jest.fn(),
      getOrganizationByUserId: jest.fn(),
      updateOrganizationStripeId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: StripeService, useValue: stripeService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PaymentController);
  });

  it('rejects a webhook without signature before calling business logic', async () => {
    await expect(
      controller.handleStripeWebhook({ rawBody: Buffer.from('{}') } as any, ''),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(subscriptionsService.handleStripeWebhook).not.toHaveBeenCalled();
  });

  it('passes the exact signed payload to webhook processing', async () => {
    const rawBody = Buffer.from('{"id":"evt_test"}');
    subscriptionsService.handleStripeWebhook.mockResolvedValue({
      received: true,
    });

    await controller.handleStripeWebhook({ rawBody } as any, 'test-signature');

    expect(subscriptionsService.handleStripeWebhook).toHaveBeenCalledWith(
      'test-signature',
      rawBody,
    );
  });

  it('creates and persists a Stripe customer only when the organization has none', async () => {
    subscriptionsService.getOrganizationByUserId.mockResolvedValue({
      id: 7,
      name: 'Org A',
      stripe_customer_id: null,
    });
    stripeService.createCustomer.mockResolvedValue({ id: 'cus_test' });
    stripeService.createSetupIntent.mockResolvedValue({
      client_secret: 'seti_secret',
    });

    await expect(
      controller.createSetupIntent({
        user: { sub: 12, email: 'owner@example.com' },
      }),
    ).resolves.toEqual({ clientSecret: 'seti_secret' });
    expect(
      subscriptionsService.updateOrganizationStripeId,
    ).toHaveBeenCalledWith(7, 'cus_test');
  });

  it('rejects deletion of a payment method owned by another organization', async () => {
    subscriptionsService.getOrganizationByUserId.mockResolvedValue({
      id: 7,
      stripe_customer_id: 'cus_org_a',
    });
    stripeService.getPaymentMethod.mockResolvedValue({
      id: 'pm_other',
      customer: 'cus_org_b',
    });

    await expect(
      controller.detachPaymentMethod({ user: { sub: 12 } }, 'pm_other'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(stripeService.detachPaymentMethod).not.toHaveBeenCalled();
  });

  it('deletes only a payment method owned by the caller organization', async () => {
    subscriptionsService.getOrganizationByUserId.mockResolvedValue({
      id: 7,
      stripe_customer_id: 'cus_org_a',
    });
    stripeService.getPaymentMethod.mockResolvedValue({
      id: 'pm_owned',
      customer: 'cus_org_a',
    });
    stripeService.detachPaymentMethod.mockResolvedValue({ id: 'pm_owned' });

    await expect(
      controller.detachPaymentMethod({ user: { sub: 12 } }, 'pm_owned'),
    ).resolves.toEqual({ id: 'pm_owned' });
    expect(stripeService.detachPaymentMethod).toHaveBeenCalledWith('pm_owned');
  });
});
