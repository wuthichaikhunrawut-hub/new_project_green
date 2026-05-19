import {
  Controller,
  Post,
  Delete,
  Param,
  Get,
  Patch,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'evidence',
    @Query('assessmentDetailId') assessmentDetailId?: string,
    @Query('userId') userId?: string,
    @Query('carbonLogId') carbonLogId?: string,
    @Query('category') category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.uploadsService.uploadFile(file, folder, {
      assessmentDetailId: assessmentDetailId
        ? Number(assessmentDetailId)
        : undefined,
      userId: userId ? Number(userId) : undefined,
      carbonLogId: carbonLogId ? Number(carbonLogId) : undefined,
      category: category,
    });
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return await this.uploadsService.deleteFile(Number(id));
  }

  @Get()
  async getFiles() {
    return await this.uploadsService.findAll();
  }

  @Patch(':id')
  async updateFile(
    @Param('id') id: string,
    @Body('category') category: string,
  ) {
    return await this.uploadsService.update(Number(id), { category });
  }
}
