import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Request,
  Query,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
const PdfPrinter = require('pdfmake/js/Printer').default;
import { getThaiPdfFonts, getGreenSyncPdfStyles } from '../common/pdf-fonts.config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExecutiveService } from './executive.service';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  orgId?: number;
}

@Controller('executive')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EXECUTIVE', 'SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN')
export class ExecutiveController {
  constructor(private readonly executiveService: ExecutiveService) {}

  @Get('dashboard')
  getDashboard(
    @Request() req: { user: JwtUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: number,
  ) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) {
      throw new BadRequestException('บัญชีนี้ไม่ได้เชื่อมกับองค์กร');
    }
    return this.executiveService.getDashboard(orgId, { startDate, endDate, branchId });
  }

  @Get('export/pdf')
  async exportDashboardPdf(
    @Request() req: { user: JwtUser },
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: number,
  ) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) throw new BadRequestException('บัญชีนี้ไม่ได้เชื่อมกับองค์กร');

    try {
      const data = await this.executiveService.getDashboard(orgId, { startDate, endDate, branchId });

      const printer = new PdfPrinter(getThaiPdfFonts());

      const generatedDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const carbonRows: any[][] = [
        [
          { text: 'Scope', style: 'tableHeader' },
          { text: 'ปี', style: 'tableHeader' },
          { text: 'การปล่อยก๊าซเรือนกระจก (kgCO₂e)', style: 'tableHeader' },
        ],
      ];
      if (data.carbonByScope && data.carbonByScope.length > 0) {
        data.carbonByScope.forEach((row: any) => {
          carbonRows.push([
            `Scope ${row.scope}`,
            `${row.year}`,
            Number(row.totalEmission || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
          ]);
        });
      } else {
        carbonRows.push([{ text: 'ยังไม่มีข้อมูลคาร์บอน', colSpan: 3, alignment: 'center', color: '#9ca3af' }, '', '']);
      }

      const docDefinition: any = {
        defaultStyle: { font: 'THSarabunNew', fontSize: 14 },
        pageMargins: [50, 60, 50, 60],
        content: [
          // Header
          { text: '🌿 รายงานสรุปผู้บริหาร', style: 'header', alignment: 'center', margin: [0, 0, 0, 4] },
          { text: 'Executive Dashboard Report — Green Sync', style: 'subheaderEn', alignment: 'center', margin: [0, 0, 0, 6] },
          { text: `สร้างเมื่อ: ${generatedDate}`, style: 'label', alignment: 'center', margin: [0, 0, 0, 24] },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 2, lineColor: '#16a34a' }],
            margin: [0, 0, 0, 20],
          },
          // Organization info
          { text: '📌 ข้อมูลองค์กร', style: 'subheader', margin: [0, 0, 0, 10] },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                [{ text: 'ชื่อองค์กร', style: 'tableHeader' }, data.orgName || '-'],
                [{ text: 'รหัสองค์กร', style: 'tableHeader' }, `${orgId}`],
                [{ text: 'เป้าหมายลดคาร์บอน', style: 'tableHeader' }, `${data.targetReductionPercent ?? 0}%`],
                [{ text: 'ความคืบหน้า Net Zero', style: 'tableHeader' }, `${data.netZeroProgressPercent ?? 0}%`],
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20],
          },
          // Assessment stats
          { text: '📊 สถิติการประเมิน Green Office', style: 'subheader', margin: [0, 0, 0, 10] },
          {
            table: {
              widths: ['50%', '50%'],
              body: [
                [{ text: 'จำนวนครั้งที่ผ่านการรับรอง', style: 'tableHeader' }, `${data.approvedCount ?? 0} ครั้ง`],
                [{ text: 'คะแนนเฉลี่ย', style: 'tableHeader' }, `${data.avgApprovedScore ?? 0} คะแนน`],
                [{ text: 'ระดับรับรองล่าสุด', style: 'tableHeader' }, data.latestCertifiedLevel || 'ยังไม่ได้รับรอง'],
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20],
          },
          // Carbon data
          { text: '🌍 ข้อมูลการปล่อยก๊าซเรือนกระจก', style: 'subheader', margin: [0, 0, 0, 10] },
          {
            table: {
              headerRows: 1,
              widths: ['20%', '20%', '60%'],
              body: carbonRows,
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20],
          },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: '#d1fae5' }],
            margin: [0, 0, 0, 10],
          },
          { text: 'ออกโดย Green Sync Platform | ระบบรับรองสำนักงานสีเขียว', style: 'footer', alignment: 'center' },
        ],
        styles: {
          ...getGreenSyncPdfStyles(),
          subheaderEn: { fontSize: 12, color: '#6b7280' },
          label: { fontSize: 12, color: '#6b7280' },
          footer: { fontSize: 10, color: '#9ca3af', italics: true },
        },
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="executive_report_${orgId}.pdf"`);

      pdfDoc.pipe(res);
      pdfDoc.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error generating PDF', error: err.message });
        }
      });
      pdfDoc.end();
    } catch (error) {
      res.status(500).json({ message: 'Error generating PDF report', error: error.message });
    }
  }

  @Post('goals')
  setGoal(@Request() req: { user: JwtUser }, @Body() body: { targetReductionPercent: number; year: number }) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) throw new BadRequestException('Organization ID missing');
    return this.executiveService.setGoal(orgId, body.targetReductionPercent, body.year);
  }

  @Get('leaderboard')
  getLeaderboard(
    @Request() req: { user: JwtUser },
    @Query('year') year?: string,
  ) {
    const orgId = Number(req.user.orgId ?? 0);
    if (!orgId) throw new BadRequestException('บัญชีนี้ไม่ได้เชื่อมกับองค์กร');
    return this.executiveService.getLeaderboard(orgId, year ? Number(year) : undefined);
  }
}
