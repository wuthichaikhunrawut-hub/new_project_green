import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Feature } from './entities/feature.entity';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Plans
  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
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
}
