import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: any; // nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      /*
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      */
      this.logger.log(
        '🚀 MailService initialized with SMTP (TEMPORARILY DISABLED)',
      );
    } else {
      this.logger.warn(
        '⚠️ SMTP configuration missing. MailService will only log to console.',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (this.transporter) {
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
        this.logger.error(`❌ Failed to send email to ${to}:`, error);
        throw error;
      }
    } else {
      this.logger.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return { mock: true };
    }
  }
}
