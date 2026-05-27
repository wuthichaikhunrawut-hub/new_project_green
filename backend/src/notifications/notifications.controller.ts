import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('system/history')
  @Roles('ADMIN', 'SYSTEM_ADMIN')
  findAllSystemWide() {
    return this.notificationsService.findAllSystemWide();
  }

  @Get()
  findAll(@Request() req) {
    return this.notificationsService.findAllForUser(req.user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  @Post()
  @Roles('ADMIN', 'SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN', 'EXECUTIVE', 'EMPLOYEE', 'USER', 'ASSESSOR')
  create(
    @Body()
    body: {
      title: string;
      message: string;
      type: NotificationType;
      recipient_id: number;
      link?: string;
    },
    @Request() req,
  ) {
    return this.notificationsService.create({
      ...body,
      sender_id: req.user.sub,
    });
  }

  @Post('bulk')
  @Roles('ADMIN', 'SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN', 'EXECUTIVE', 'EMPLOYEE', 'USER', 'ASSESSOR')
  createBulk(
    @Body()
    body: {
      title: string;
      message: string;
      type: NotificationType;
      recipient_ids: number[];
      link?: string;
    },
    @Request() req,
  ) {
    return this.notificationsService.createBulk({
      ...body,
      sender_id: req.user.sub,
    });
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SYSTEM_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }
}
