import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('🚀 MailService initialized with SMTP');
    } else {
      this.logger.warn(
        '⚠️ SMTP configuration missing. MailService will only log to console.',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string, retries = 3) {
    if (this.transporter) {
      let attempt = 0;
      while (attempt < retries) {
        try {
          const info = await this.transporter.sendMail({
            from: `"Green Office System" <${this.configService.get<string>('SMTP_USER')}>`,
            to,
            subject,
            html,
          });
          this.logger.log(`✅ Email sent to ${to}: ${info.messageId}`);
          return info;
        } catch (error) {
          attempt++;
          this.logger.error(`❌ Failed to send email to ${to} (Attempt ${attempt}/${retries}):`, error.message);
          if (attempt >= retries) {
            throw error;
          }
          await new Promise((res) => setTimeout(res, 2000)); // wait 2 seconds
        }
      }
    } else {
      this.logger.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return { mock: true };
    }
  }

  // --- Email Templates ---
  getVerificationEmailTemplate(userName: string, verifyLink: string) {
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>ยินดีต้อนรับสู่ Green Sync, ${userName}</h2>
        <p>กรุณายืนยันอีเมลของคุณเพื่อเริ่มต้นใช้งานระบบ</p>
        <a href="${verifyLink}" style="padding: 10px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">ยืนยันอีเมล</a>
      </div>
    `;
  }

  getAssessmentNotificationTemplate(orgName: string, date: string) {
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>แจ้งเตือนการประเมิน</h2>
        <p>องค์กร ${orgName} มีกำหนดการประเมินในวันที่ ${date}</p>
        <p>กรุณาเตรียมเอกสารหลักฐานให้พร้อม</p>
      </div>
    `;
  }

  getApprovalTemplate(orgName: string) {
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>ขอแสดงความยินดี!</h2>
        <p>องค์กร ${orgName} ของคุณผ่านการประเมินสำนักงานสีเขียวแล้ว</p>
        <p>คุณสามารถดาวน์โหลดใบรับรองได้จากระบบ</p>
      </div>
    `;
  }
}
