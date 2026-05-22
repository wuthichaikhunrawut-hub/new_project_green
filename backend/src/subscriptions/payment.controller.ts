import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentController {
  private stripe: any;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fake';
    this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' as any });
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: any;

    try {
      if (this.endpointSecret && signature && req.rawBody) {
        event = this.stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          this.endpointSecret,
        );
      } else {
        event = req.body;
      }
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    console.log('--- Stripe Webhook Received ---', event.type);

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          await this.subscriptionsService.handleInvoicePaymentSucceeded(invoice);
          break;
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          await this.subscriptionsService.handleInvoicePaymentFailed(failedInvoice);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          await this.subscriptionsService.handleSubscriptionChange(subscription);
          break;
        case 'checkout.session.completed':
          const session = event.data.object;
          await this.subscriptionsService.handleCheckoutSessionCompleted(session);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-intent')
  async createSetupIntent(@Req() req) {
    try {
      const org = await this.subscriptionsService.getOrganizationByUserId(req.user.sub);
      let stripeCustomerId = org.stripe_customer_id;

      if (!stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(req.user.email, org.name);
        stripeCustomerId = customer.id;
        await this.subscriptionsService.updateOrganizationStripeId(org.id, stripeCustomerId);
      }

      const setupIntent = await this.stripeService.createSetupIntent(stripeCustomerId);
      return { clientSecret: setupIntent.client_secret };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('methods')
  async listPaymentMethods(@Req() req) {
    const org = await this.subscriptionsService.getOrganizationByUserId(req.user.sub);
    if (!org.stripe_customer_id) return [];

    const methods = await this.stripeService.listPaymentMethods(org.stripe_customer_id);
    return (methods.data || []).map((m: any) => ({
      id: m.id,
      type: m.type,
      brand: m.card?.brand || m.type,
      last4: m.card?.last4 || '',
      expMonth: m.card?.exp_month,
      expYear: m.card?.exp_year,
      isDefault: false,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('methods/:id')
  async detachPaymentMethod(@Param('id') id: string) {
    return this.stripeService.detachPaymentMethod(id);
  }
}
