import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private mailService: MailService,
    private usersService: UsersService,
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
    const saved = await this.notificationsRepository.save(notification);

    // Trigger Email sending async
    this.usersService
      .findOne(data.recipient_id)
      .then((user) => {
        if (user && user.email) {
          this.mailService.sendMail(
            user.email,
            `แจ้งเตือนระบบ: ${data.title}`,
            `<h3>${data.title}</h3><p>${data.message}</p>${data.link ? `<a href="${data.link}">คลิกเพื่อดูรายละเอียด</a>` : ''}`,
          );
        }
      })
      .catch((err) =>
        console.error('Error fetching user for email notification:', err),
      );

    return saved;
  }

  async createBulk(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_ids: number[];
    sender_id?: number;
    link?: string;
  }): Promise<Notification[]> {
    const notifications = data.recipient_ids.map((id) =>
      this.notificationsRepository.create({
        ...data,
        recipient_id: id,
      }),
    );
    const saved = await this.notificationsRepository.save(notifications);

    // Send bulk emails
    data.recipient_ids.forEach((id) => {
      this.usersService
        .findOne(id)
        .then((user) => {
          if (user && user.email) {
            this.mailService.sendMail(
              user.email,
              `แจ้งเตือนระบบ: ${data.title}`,
              `<h3>${data.title}</h3><p>${data.message}</p>${data.link ? `<a href="${data.link}">คลิกเพื่อดูรายละเอียด</a>` : ''}`,
            );
          }
        })
        .catch((err) =>
          console.error(`Error sending bulk email to user ${id}:`, err),
        );
    });

    return saved;
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

  async remove(id: number): Promise<void> {
    const result = await this.notificationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { recipient_id: userId, is_read: false },
      { is_read: true },
    );
  }

  async findAllSystemWide(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      relations: ['recipient'],
      order: { created_at: 'DESC' },
      take: 200,
    });
  }
}
