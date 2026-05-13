import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.notificationsService.findAllForUser(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Post()
  @Roles('ADMIN', 'SYSTEM_ADMIN')
  create(@Body() body: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_id: number;
    link?: string;
  }, @Request() req) {
    return this.notificationsService.create({
      ...body,
      sender_id: req.user.userId,
    });
  }

  @Post('bulk')
  @Roles('ADMIN', 'SYSTEM_ADMIN')
  createBulk(@Body() body: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_ids: number[];
    link?: string;
  }, @Request() req) {
    return this.notificationsService.createBulk({
      ...body,
      sender_id: req.user.userId,
    });
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
