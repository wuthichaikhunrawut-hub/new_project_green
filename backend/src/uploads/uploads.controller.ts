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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'อัปโหลดไฟล์หลักฐานประเมินหรือใบประกาศนียบัตร' })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'โฟลเดอร์สำหรับจัดเก็บ (default: evidence)',
    example: 'evidence',
  })
  @ApiQuery({
    name: 'assessmentDetailId',
    required: false,
    description: 'ไอดีของหัวข้อเกณฑ์การประเมินย่อย',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'ไอดีของผู้ใช้งานที่อัปโหลด',
  })
  @ApiQuery({
    name: 'carbonLogId',
    required: false,
    description: 'ไอดีของรายการบันทึกคาร์บอน',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'ประเภทหัวข้อหลักฐาน',
  })
  @ApiResponse({
    status: 201,
    description: 'อัปโหลดสำเร็จ ส่งคืนรายละเอียดไฟล์ที่บันทึก',
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder: string = 'evidence',
    @Query('assessmentDetailId') assessmentDetailId?: string,
    @Query('userId') userId?: string,
    @Query('carbonLogId') carbonLogId?: string,
    @Query('category') category?: string,
    @Req() req?: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const role = req?.user?.role;
    const normalizeRole = (r: string): string => {
      return String(r || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
    };
    const userRole = normalizeRole(role);

    let targetUserId = userId ? Number(userId) : undefined;
    if (
      userRole !== 'SYSTEMADMIN' &&
      userRole !== 'ASSESSOR' &&
      userRole !== 'ASSESSORADMIN'
    ) {
      targetUserId = req?.user?.sub;
    }

    return await this.uploadsService.uploadFile(
      file,
      folder,
      {
        assessmentDetailId: assessmentDetailId
          ? Number(assessmentDetailId)
          : undefined,
        userId: targetUserId,
        carbonLogId: carbonLogId ? Number(carbonLogId) : undefined,
        category: category,
      },
      req?.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดข้อมูลไฟล์หลักฐานด้วยรหัส ID' })
  @ApiParam({ name: 'id', description: 'รหัสประจำไฟล์หลักฐาน' })
  @ApiResponse({ status: 200, description: 'โหลดรายละเอียดไฟล์สำเร็จ' })
  async getFile(@Param('id') id: string, @Req() req: any) {
    return await this.uploadsService.findOne(Number(id), req.user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'ลบไฟล์หลักฐานและออกจากที่เก็บข้อมูล (IDOR Checked)',
  })
  @ApiParam({ name: 'id', description: 'รหัสประจำไฟล์ที่ต้องการลบ' })
  @ApiResponse({ status: 200, description: 'ลบไฟล์สำเร็จ' })
  async deleteFile(@Param('id') id: string, @Req() req: any) {
    return await this.uploadsService.deleteFile(Number(id), req.user);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงไฟล์หลักฐานทั้งหมดที่เข้าถึงได้ขององค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดข้อมูลรายการไฟล์สำเร็จ' })
  async getFiles(@Req() req: any) {
    return await this.uploadsService.findAll(req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขประเภท/หมวดหมู่ของไฟล์หลักฐาน' })
  @ApiParam({ name: 'id', description: 'รหัสไฟล์ที่ต้องการแก้ไข' })
  @ApiResponse({ status: 200, description: 'แก้ไขข้อมูลสำเร็จ' })
  async updateFile(
    @Param('id') id: string,
    @Body('category') category: string,
    @Req() req: any,
  ) {
    return await this.uploadsService.update(Number(id), { category }, req.user);
  }
}
