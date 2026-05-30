import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { EmissionFactorsService } from '../carbon-logs/emission-factors.service';
import { GreenCriteriaService } from '../assessments/green-criteria.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private mailService: MailService,
    private usersService: UsersService,
    private emissionFactorsService: EmissionFactorsService,
    private greenCriteriaService: GreenCriteriaService,
  ) {}

  async findSystemAdmin(): Promise<any> {
    try {
      const admins = await this.usersService.findAll('System Admin');
      if (admins && admins.length > 0) return admins[0];
      
      const systemAdmins = await this.usersService.findAll('SYSTEM_ADMIN');
      if (systemAdmins && systemAdmins.length > 0) return systemAdmins[0];

      const legacyAdmins = await this.usersService.findAll('ADMIN');
      if (legacyAdmins && legacyAdmins.length > 0) return legacyAdmins[0];

      const allUsers = await this.usersService.findAll();
      if (allUsers && allUsers.length > 0) return allUsers[0];
    } catch (e) {
      console.error('Error finding system admin in notifications service:', e);
    }
    return null;
  }

  async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_id: number;
    sender_id?: number;
    link?: string;
  }): Promise<Notification> {
    let finalRecipientId = data.recipient_id;
    let recipientExists = false;

    if (finalRecipientId) {
      try {
        const user = await this.usersService.findOne(finalRecipientId);
        if (user) recipientExists = true;
      } catch {
        recipientExists = false;
      }
    }

    if (!recipientExists) {
      const admin = await this.findSystemAdmin();
      if (admin) {
        finalRecipientId = admin.id;
      } else {
        // Absolute fallback to current sender
        finalRecipientId = data.sender_id || finalRecipientId;
      }
    }

    const notification = this.notificationsRepository.create({
      ...data,
      recipient_id: finalRecipientId,
    });
    const saved = await this.notificationsRepository.save(notification);

    // Trigger Email sending async
    this.usersService
      .findOne(finalRecipientId)
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
      relations: ['recipient', 'sender'],
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  async proposeAcademicChange(
    userId: number,
    data: {
      targetType: 'CRITERIA' | 'EMISSION_FACTOR';
      targetId: number;
      name: string;
      oldValue: string;
      newValue: string;
      reason: string;
    },
  ): Promise<Notification> {
    const admin = await this.findSystemAdmin();
    const adminId = admin ? admin.id : userId;

    const title = `คำเสนอวิชาการ: ${
      data.targetType === 'CRITERIA' ? 'เกณฑ์สำนักงานสีเขียว' : 'สูตรคำนวณคาร์บอน'
    }`;

    const messageObj = {
      targetType: data.targetType,
      targetId: data.targetId,
      name: data.name,
      oldValue: data.oldValue,
      newValue: data.newValue,
      reason: data.reason,
      status: 'PENDING',
    };

    return this.create({
      title,
      message: JSON.stringify(messageObj),
      type: NotificationType.REQUEST,
      recipient_id: adminId,
      sender_id: userId,
      link: '/admin/approvals',
    });
  }

  async approveAcademicChange(notificationId: number, adminId: number): Promise<any> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('คำขอไม่พบในระบบ');
    }

    let payload: any;
    try {
      payload = JSON.parse(notification.message);
    } catch (e) {
      throw new NotFoundException('ข้อมูลคำขอชำรุดเสียหาย');
    }

    if (payload.status !== 'PENDING') {
      return { success: false, message: 'คำขอนี้ได้รับการประมวลผลไปแล้ว' };
    }

    if (payload.targetType === 'CRITERIA') {
      await this.greenCriteriaService.update(payload.targetId, {
        max_score: parseFloat(payload.newValue),
      });
    } else if (payload.targetType === 'EMISSION_FACTOR') {
      await this.emissionFactorsService.update(payload.targetId, {
        factor_value: parseFloat(payload.newValue),
      });
    }

    payload.status = 'APPROVED';
    notification.message = JSON.stringify(payload);
    notification.is_read = true;
    await this.notificationsRepository.save(notification);

    await this.create({
      title: `ข้อเสนอวิชาการของคุณได้รับการอนุมัติแล้ว`,
      message: `ข้อเสนอปรับปรุงสำหรับ "${payload.name}" ได้รับการอนุมัติและเปิดใช้งานจริงในระบบฐานข้อมูลเรียบร้อยครับ`,
      type: NotificationType.SYSTEM,
      recipient_id: notification.sender_id,
      sender_id: adminId,
    });

    return { success: true, payload };
  }

  async rejectAcademicChange(
    notificationId: number,
    adminId: number,
    rejectReason: string,
  ): Promise<any> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('คำขอไม่พบในระบบ');
    }

    let payload: any;
    try {
      payload = JSON.parse(notification.message);
    } catch (e) {
      throw new NotFoundException('ข้อมูลคำขอชำรุดเสียหาย');
    }

    if (payload.status !== 'PENDING') {
      return { success: false, message: 'คำขอนี้ได้รับการประมวลผลไปแล้ว' };
    }

    payload.status = 'REJECTED';
    payload.rejectReason = rejectReason;
    notification.message = JSON.stringify(payload);
    notification.is_read = true;
    await this.notificationsRepository.save(notification);

    await this.create({
      title: `ข้อเสนอวิชาการของคุณไม่ได้รับการอนุมัติ`,
      message: `ข้อเสนอปรับปรุงสำหรับ "${payload.name}" ไม่ผ่านการอนุมัติเนื่องจาก: "${rejectReason}"`,
      type: NotificationType.SYSTEM,
      recipient_id: notification.sender_id,
      sender_id: adminId,
    });

    return { success: true, payload };
  }
}
