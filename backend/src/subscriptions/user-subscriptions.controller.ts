import { Controller, Get, Post, Body, UseGuards, Req, Header } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class UserSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMySubscription(@Req() req) {
    const userId = req.user.sub || req.user.userId;
    const org = await this.subscriptionsService.getOrganizationByUserId(userId);
    return this.subscriptionsService.findOrgSubscription(org.id);
  }

  @Get('my/usage')
  async getMyUsage(@Req() req) {
    const userId = req.user.sub || req.user.userId;
    const org = await this.subscriptionsService.getOrganizationByUserId(userId);
    return this.subscriptionsService.getOrganizationFeatureQuotaSummary(org.id);
  }

  @Get('my/payments')
  async getMyPayments(@Req() req) {
    const userId = req.user.sub || req.user.userId;
    const org = await this.subscriptionsService.getOrganizationByUserId(userId);
    return this.subscriptionsService.getOrganizationPayments(org.id);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Post('my/subscribe')
  async subscribeToPlan(@Req() req, @Body('planId') planId: number) {
    const userId = req.user.sub || req.user.userId;
    const org = await this.subscriptionsService.getOrganizationByUserId(userId);
    return this.subscriptionsService.subscribeToPlan(org.id, planId);
  }
}
