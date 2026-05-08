import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Controller('admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Plans
  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
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
    return this.subscriptionsService.updateInvoiceStatus(parseInt(id, 10), status);
  }
}
