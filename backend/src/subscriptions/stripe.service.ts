import { Injectable, OnModuleInit } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: any;

  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    await this.initStripe();
  }

  private async initStripe() {
    const secretKey =
      await this.settingsService.getSetting('stripe.secret_key');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {});
    }
  }

  async constructEvent(payload: Buffer, signature: string) {
    if (!this.stripe) await this.initStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  async createCustomer(email: string, name: string) {
    if (!this.stripe) await this.initStripe();
    try {
      console.log('Creating Stripe Customer for:', email);
      const customer = await this.stripe.customers.create({
        email,
        name,
      });
      console.log('Stripe Customer Created Successfully:', customer.id);
      return customer;
    } catch (error) {
      console.error('Stripe Create Customer Error:', error);
      throw error;
    }
  }

  async createSetupIntent(customerId: string) {
    if (!this.stripe) await this.initStripe();
    try {
      console.log('Creating SetupIntent for customer:', customerId);
      const intent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
      console.log('SetupIntent Created Successfully:', intent.id);
      return intent;
    } catch (error) {
      console.error('Stripe Create SetupIntent Error:', error);
      throw error;
    }
  }

  async listPaymentMethods(customerId: string) {
    if (!this.stripe) await this.initStripe();
    try {
      return await this.stripe.paymentMethods.list({
        customer: customerId,
      });
    } catch (error) {
      console.error('Stripe List Payment Methods Error:', error);
      throw error;
    }
  }

  async detachPaymentMethod(paymentMethodId: string) {
    if (!this.stripe) await this.initStripe();
    return this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async createSubscription(customerId: string, priceId: string) {
    if (!this.stripe) await this.initStripe();
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }
}
