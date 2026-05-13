import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_id: number;
    sender_id?: number;
    link?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(notification);
  }

  async createBulk(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_ids: number[];
    sender_id?: number;
    link?: string;
  }): Promise<Notification[]> {
    const notifications = data.recipient_ids.map(id => 
      this.notificationsRepository.create({
        ...data,
        recipient_id: id
      })
    );
    return this.notificationsRepository.save(notifications);
  }

  async findAllForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipient_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationsRepository.count({
      where: { recipient_id: userId, is_read: false },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, recipient_id: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.is_read = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { recipient_id: userId, is_read: false },
      { is_read: true },
    );
  }
}
