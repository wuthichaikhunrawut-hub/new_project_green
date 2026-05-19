import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeminiService } from './gemini.service';
import { memoryStorage } from 'multer';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('ocr')
  @UseInterceptors(
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
  async chat(@Body() body: { message: string }) {
    if (!body?.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    return this.geminiService.chat(body.message);
  }
}
