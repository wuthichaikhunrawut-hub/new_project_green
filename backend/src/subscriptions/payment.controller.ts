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
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Body() event: any) {
    console.log('--- Stripe Webhook Received ---', event.type);

    // Example: invoice.payment_succeeded
    if (event.type === 'invoice.payment_succeeded') {
      const invoiceData = event.data.object;

      // In a real app, verify signature using raw body
      // const signature = req.headers['stripe-signature'];

      const customerId = invoiceData.customer;
      const amountPaid = invoiceData.amount_paid / 100;
      const currency = invoiceData.currency.toUpperCase();

      console.log(
        `Payment succeeded for customer ${customerId}: ${amountPaid} ${currency}`,
      );

      // We would look up the organization by stripe_customer_id
      // and insert a record into Payment table

      // Since we don't have stripe_customer_id query directly in service right now,
      // this is just the skeleton to fulfill Phase 3 requirement.
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-intent')
  async createSetupIntent(@Req() req) {
    try {
      console.log('--- SetupIntent Request Started ---');
      console.log('User ID (sub):', req.user.sub);
      const org = await this.subscriptionsService.getOrganizationByUserId(
        req.user.sub,
      );
      console.log('Org Found:', org?.name, 'ID:', org?.id);

      let stripeCustomerId = org.stripe_customer_id;

      if (!stripeCustomerId) {
        console.log('No Stripe Customer ID found. Creating new customer...');
        const customer = await this.stripeService.createCustomer(
          req.user.email,
          org.name,
        );
        stripeCustomerId = customer.id;
        console.log('New Stripe Customer Created:', stripeCustomerId);
        // Update org with stripe_customer_id
        await this.subscriptionsService.updateOrganizationStripeId(
          org.id,
          stripeCustomerId,
        );
      }

      console.log(
        'Calling Stripe to create SetupIntent for:',
        stripeCustomerId,
      );
      const setupIntent =
        await this.stripeService.createSetupIntent(stripeCustomerId);
      console.log('SetupIntent Created Successfully:', setupIntent.id);

      return {
        clientSecret: setupIntent.client_secret,
      };
    } catch (error) {
      console.error('--- SetupIntent Request Failed ---');
      console.error(error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('methods')
  async listPaymentMethods(@Req() req) {
    const org = await this.subscriptionsService.getOrganizationByUserId(
      req.user.userId,
    );
    if (!org.stripe_customer_id) return [];

    const methods = await this.stripeService.listPaymentMethods(
      org.stripe_customer_id,
    );
    return (methods.data || []).map((m: any) => ({
      id: m.id,
      type: m.type,
      brand: m.card?.brand || m.type,
      last4: m.card?.last4 || '',
      expMonth: m.card?.exp_month,
      expYear: m.card?.exp_year,
      isDefault: false, // Logic for default could be added if stored
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('methods/:id')
  async detachPaymentMethod(@Param('id') id: string) {
    return this.stripeService.detachPaymentMethod(id);
  }
}
