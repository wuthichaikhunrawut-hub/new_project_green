import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Logger,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CarbonLogsService } from './carbon-logs.service';
import { CreateCarbonLogDto } from './dto/create-carbon-log.dto';
import { UpdateCarbonLogDto } from './dto/update-carbon-log.dto';

@ApiTags('carbon-logs')
@ApiBearerAuth()
@Controller('carbon-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarbonLogsController {
  private readonly logger = new Logger(CarbonLogsController.name);

  constructor(private readonly carbonLogsService: CarbonLogsService) {}

  private getOrgId(req: any): number {
    const role = req.user?.role;
    const normalizeRole = (r: string): string => {
      return String(r || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
    };
    const userRole = normalizeRole(role);

    if (
      userRole === 'SYSTEMADMIN' ||
      userRole === 'ASSESSOR' ||
      userRole === 'ASSESSORADMIN'
    ) {
      const orgIdStr = req.headers['x-org-id'];
      if (!orgIdStr || orgIdStr === 'undefined' || orgIdStr === 'null') {
        throw new BadRequestException('ไม่พบค่า x-org-id ใน Header');
      }
      const orgId = parseInt(orgIdStr, 10);
      if (isNaN(orgId)) {
        throw new BadRequestException('ค่า x-org-id ไม่ถูกต้อง');
      }
      return orgId;
    }

    const orgId = Number(req.user?.orgId);
    if (!orgId) {
      throw new BadRequestException(
        'ไม่พบไอดีองค์กรของคุณในสิทธิ์การใช้งาน (JWT)',
      );
    }
    return orgId;
  }

  @Post()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE')
  @ApiOperation({
    summary: 'บันทึกข้อมูลการใช้ทรัพยากรคาร์บอน (ค่าไฟ/น้ำ/น้ำมัน ฯลฯ)',
  })
  @ApiResponse({ status: 201, description: 'บันทึกสำเร็จ' })
  create(@Body() createDto: CreateCarbonLogDto, @Request() req: any) {
    return this.carbonLogsService.create(createDto, this.getOrgId(req));
  }

  @Get('trend')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'ดึงข้อมูลแนวโน้มการปล่อยคาร์บอนรายเดือน' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'วันที่เริ่มต้น เช่น 2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'วันที่สิ้นสุด เช่น 2026-12-31',
  })
  @ApiResponse({ status: 200, description: 'โหลดแนวโน้มสำเร็จ' })
  getTrend(@Request() req: any) {
    const startDate = req.query?.startDate as string | undefined;
    const endDate = req.query?.endDate as string | undefined;
    return this.carbonLogsService.getCarbonTrend(
      this.getOrgId(req),
      startDate,
      endDate,
    );
  }

  @Get('personal-dashboard')
  @Roles('USER', 'ORG_ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'ดึงสรุปแดชบอร์ดข้อมูลส่วนบุคคล/ภาพรวมองค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดข้อมูลสำเร็จ' })
  getPersonalDashboard(@Request() req: any) {
    const userId = Number(req.user.sub);
    const orgId = req.user.orgId ? Number(req.user.orgId) : undefined;
    return this.carbonLogsService.getPersonalDashboard(userId, orgId);
  }

  @Get()
  @Roles(
    'SYSTEM_ADMIN',
    'ORG_ADMIN',
    'USER',
    'EMPLOYEE',
    'ASSESSOR',
    'ASSESSOR_ADMIN',
  )
  @ApiOperation({ summary: 'ดึงรายการบันทึกข้อมูลคาร์บอนทั้งหมดขององค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดรายการสำเร็จ' })
  findAll(@Request() req: any) {
    this.logger.log(`Executing findAll for orgId: ${this.getOrgId(req)}`);
    return this.carbonLogsService.findAll(this.getOrgId(req));
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE')
  @ApiOperation({ summary: 'แก้ไขรายการบันทึกข้อมูลคาร์บอน' })
  @ApiParam({ name: 'id', description: 'รหัสของรายการบันทึกคาร์บอน' })
  @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCarbonLogDto,
    @Request() req: any,
  ) {
    return this.carbonLogsService.update(
      parseInt(id, 10),
      this.getOrgId(req),
      updateDto,
    );
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE')
  @ApiOperation({ summary: 'ลบรายการบันทึกข้อมูลคาร์บอน' })
  @ApiParam({
    name: 'id',
    description: 'รหัสของรายการบันทึกคาร์บอนที่ต้องการลบ',
  })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  remove(@Param('id') id: string, @Request() req: any) {
    this.logger.log(
      `Executing remove for id: ${id}, orgId: ${this.getOrgId(req)}`,
    );
    return this.carbonLogsService.remove(parseInt(id, 10), this.getOrgId(req));
  }
}
