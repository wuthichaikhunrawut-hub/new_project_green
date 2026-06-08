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
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // --- Public APIs (ไม่ต้องล็อกอิน) ---
  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('features')
  findAllFeatures() {
    return this.subscriptionsService.findAllFeatures();
  }

  // --- User / Organization APIs (ต้องล็อกอิน) ---
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EXECUTIVE')
  async getStatus(@Request() req: any) {
    return this.subscriptionsService.getUserSubscriptionStatusByUserId(
      req.user.id,
    );
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EXECUTIVE')
  async getPayments(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.getOrganizationPayments(orgId);
  }

  @Delete('my/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZATION_ADMIN', 'EXECUTIVE')
  async cancelMySubscription(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.cancelSubscription(orgId);
  }

  // --- System Admin APIs (เฉพาะผู้ดูแลระบบ) ---
  @Post('features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  createFeature(@Body() data: Partial<Feature>) {
    return this.subscriptionsService.createFeature(data);
  }

  @Put('features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  updateFeature(@Param('id') id: string, @Body() data: Partial<Feature>) {
    return this.subscriptionsService.updateFeature(parseInt(id, 10), data);
  }

  @Delete('features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  removeFeature(@Param('id') id: string) {
    return this.subscriptionsService.removeFeature(parseInt(id, 10));
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  createPlan(@Body() data: Partial<SubscriptionPlan>) {
    return this.subscriptionsService.createPlan(data);
  }

  @Put('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  updatePlan(@Param('id') id: string, @Body() data: Partial<SubscriptionPlan>) {
    return this.subscriptionsService.updatePlan(parseInt(id, 10), data);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(parseInt(id, 10));
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  findAllInvoices() {
    return this.subscriptionsService.findAllInvoices();
  }

  @Put('invoices/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  updateInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.subscriptionsService.updateInvoiceStatus(
      parseInt(id, 10),
      status,
    );
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZATION_ADMIN', 'EXECUTIVE')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZATION_ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE')
  @Header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  )
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getMyQuotas(@Request() req: any) {
    const orgId = Number(req.user.orgId);
    return this.subscriptionsService.getOrganizationFeatureQuotaSummary(orgId);
  }
}
