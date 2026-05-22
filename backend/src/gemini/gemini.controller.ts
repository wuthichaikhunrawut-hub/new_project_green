import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeminiService } from './gemini.service';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureQuotaInterceptor } from '../subscriptions/interceptors/feature-quota.interceptor';
import { FeatureCode } from '../subscriptions/decorators/feature-code.decorator';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

@Controller('gemini')
@UseGuards(JwtAuthGuard)
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('ocr')
  @FeatureCode('AI_SCAN')
  @UseInterceptors(
    FeatureQuotaInterceptor,
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image files (JPG, PNG, WEBP) and PDF are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadBill(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.geminiService.ocr(file.buffer, file.mimetype);
    return result;
  }

  @Post('chat')
  async chat(
    @Body() body: { message: string },
    @Request() req: { user: JwtUser },
  ) {
    if (!body?.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    const userId = Number(req.user.sub);
    return this.geminiService.chat(body.message, userId);
  }

  @Get('history')
  async getHistory(@Request() req: { user: JwtUser }) {
    const userId = Number(req.user.sub);
    return this.geminiService.getChatHistory(userId);
  }

  @Post('evidence-validation')
  @FeatureCode('AI_SCAN')
  @UseInterceptors(
    FeatureQuotaInterceptor,
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async validateEvidence(
    @UploadedFile() file: Express.Multer.File,
    @Body('categoryId') categoryId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.geminiService.validateEvidence(file.buffer, file.mimetype, categoryId || 'ไม่ระบุหมวดหมู่');
  }

  @Delete('history')
  async clearHistory(@Request() req: { user: JwtUser }) {
    const userId = Number(req.user.sub);
    await this.geminiService.clearChatHistory(userId);
    return { success: true };
  }

  @Post('executive-summary')
  async getExecutiveSummary(@Body() body: any) {
    return this.geminiService.generateExecutiveSummary(body);
  }

  @Post('recommendations')
  async getRecommendations(@Body() body: any) {
    return this.geminiService.getRecommendations(body);
  }
}
