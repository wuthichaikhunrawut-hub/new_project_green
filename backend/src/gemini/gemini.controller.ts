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
  Param,
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
    @Body() body: { message: string, sessionId?: number },
    @Request() req: { user: JwtUser },
  ) {
    if (!body?.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    const userId = Number(req.user.sub);
    return this.geminiService.chat(body.message, userId, body.sessionId);
  }

  @Get('sessions')
  async getSessions(@Request() req: { user: JwtUser }) {
    const userId = Number(req.user.sub);
    return this.geminiService.getSessions(userId);
  }

  @Post('sessions')
  async createSession(@Request() req: { user: JwtUser }, @Body() body: { title?: string }) {
    const userId = Number(req.user.sub);
    return this.geminiService.createSession(userId, body.title || 'New Conversation');
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(@Request() req: { user: JwtUser }, @Param('id') id: string) {
    const userId = Number(req.user.sub);
    return this.geminiService.getSessionMessages(+id, userId);
  }

  @Delete('sessions/:id')
  async deleteSession(@Request() req: { user: JwtUser }, @Param('id') id: string) {
    const userId = Number(req.user.sub);
    await this.geminiService.deleteSession(+id, userId);
    return { success: true };
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
  async getExecutiveSummary(@Body() body: any, @Request() req: { user: JwtUser }) {
    const userId = Number(req.user.sub);
    return this.geminiService.generateExecutiveSummary(body, userId);
  }

  @Post('recommendations')
  async getRecommendations(@Body() body: any, @Request() req: { user: JwtUser }) {
    const userId = Number(req.user.sub);
    return this.geminiService.getRecommendations(body, userId);
  }
}
