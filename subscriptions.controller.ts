import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  async getStatus(@Request() req) {
    // ดึง userId จาก JWT Token
    return this.subscriptionsService.getUserSubscriptionStatus(req.user.id);
  }

  @Get('payments')
  async getPayments(@Request() req) {
    return this.subscriptionsService.getPaymentHistory(req.user.id);
  }
}