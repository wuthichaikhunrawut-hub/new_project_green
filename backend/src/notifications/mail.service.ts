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

  getResetPasswordTemplate(userName: string, resetLink: string) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">🔑 รีเซ็ตรหัสผ่าน</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">Green Sync — ระบบจัดการสำนักงานสีเขียว</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.7;">สวัสดีครับ <strong>${userName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.7;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณากดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #059669, #0d9488); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(5,150,105,0.3);">ตั้งรหัสผ่านใหม่</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong> หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="color: #cbd5e1; font-size: 11px; text-align: center;">© 2026 GreenSync Technology. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  getWelcomeTemplate(userName: string) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">🎉 ยินดีต้อนรับสู่ Green Sync</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.7;">สวัสดีครับ <strong>${userName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.7;">ขอบคุณที่สมัครสมาชิกกับเรา ระบบพร้อมให้คุณเข้าใช้งานเพื่อจัดการสำนักงานสีเขียวได้อย่างเต็มรูปแบบแล้ว</p>
        </div>
      </div>
    `;
  }

  getAssessmentSubmittedTemplate(orgName: string) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">📄 ได้รับข้อมูลการประเมินแล้ว</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.7;">เรียน <strong>${orgName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.7;">ทางเราได้รับข้อมูลแบบประเมินและหลักฐานของคุณเรียบร้อยแล้ว ผู้ประเมินจะดำเนินการตรวจสอบในลำดับถัดไป</p>
        </div>
      </div>
    `;
  }

  getAssessmentReviewedTemplate(orgName: string, status: string) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">✅ ทราบผลการประเมินเบื้องต้น</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.7;">เรียน <strong>${orgName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.7;">ผลการประเมินล่าสุดของคุณได้รับการอัปเดตสถานะเป็น: <strong>${status}</strong> คุณสามารถเข้าสู่ระบบเพื่อตรวจสอบคะแนนเพิ่มเติมได้</p>
        </div>
      </div>
    `;
  }
}
