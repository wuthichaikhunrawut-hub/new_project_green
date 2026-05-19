import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

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

  @Delete('methods/:id')
  async detachPaymentMethod(@Param('id') id: string) {
    return this.stripeService.detachPaymentMethod(id);
  }
}
