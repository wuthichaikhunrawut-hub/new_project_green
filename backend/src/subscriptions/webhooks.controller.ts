import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('webhook')
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature || !request.rawBody) {
      return { received: false, error: 'Missing signature or rawBody' };
    }
    return this.subscriptionsService.handleStripeWebhook(signature, request.rawBody);
  }
}
