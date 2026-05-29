import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Header,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Feature } from './entities/feature.entity';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'USER')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Plans
  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('status')
  async getStatus(@Request() req: any) {
    return this.subscriptionsService.getUserSubscriptionStatusByUserId(
      req.user.id,
    );
  }

  @Get('payments')
  async getPayments(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.getOrganizationPayments(orgId);
  }

  @Delete('my/cancel')
  async cancelMySubscription(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.cancelSubscription(orgId);
  }

  @Get('features')
  findAllFeatures() {
    return this.subscriptionsService.findAllFeatures();
  }

  @Post('features')
  createFeature(@Body() data: Partial<Feature>) {
    return this.subscriptionsService.createFeature(data);
  }

  @Put('features/:id')
  updateFeature(@Param('id') id: string, @Body() data: Partial<Feature>) {
    return this.subscriptionsService.updateFeature(parseInt(id, 10), data);
  }

  @Delete('features/:id')
  removeFeature(@Param('id') id: string) {
    return this.subscriptionsService.removeFeature(parseInt(id, 10));
  }

  @Post('plans')
  createPlan(@Body() data: Partial<SubscriptionPlan>) {
    return this.subscriptionsService.createPlan(data);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() data: Partial<SubscriptionPlan>) {
    return this.subscriptionsService.updatePlan(parseInt(id, 10), data);
  }

  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(parseInt(id, 10));
  }

  // Invoices
  @Get('invoices')
  findAllInvoices() {
    return this.subscriptionsService.findAllInvoices();
  }

  @Put('invoices/:id/status')
  updateInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.subscriptionsService.updateInvoiceStatus(
      parseInt(id, 10),
      status,
    );
  }

  // Feature Usage Logs
  @Get('usage')
  @Roles('ORGANIZATION_ADMIN')
  getUsageLogs(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.getFeatureUsageLogs(
      orgId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('my/quotas')
  @Roles('ORGANIZATION_ADMIN', 'SYSTEM_ADMIN')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyQuotas(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.getOrganizationFeatureQuotaSummary(orgId);
  }
}
