import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Delete,
  ParseIntPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'สร้างหน่วยงาน/องค์กรใหม่ (เฉพาะ SYSTEM_ADMIN เท่านั้น)',
  })
  @ApiResponse({ status: 201, description: 'สร้างองค์กรสำเร็จ' })
  create(@Body() createData: CreateOrganizationDto) {
    return this.organizationsService.create(createData);
  }

  @Get()
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'ดึงรายชื่อองค์กรทั้งหมด (เฉพาะ SYSTEM_ADMIN เท่านั้น)',
  })
  @ApiResponse({ status: 200, description: 'โหลดรายชื่อสำเร็จ' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get('export/csv')
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'ส่งออกข้อมูลองค์กรทั้งหมดเป็น CSV (เฉพาะ SYSTEM_ADMIN เท่านั้น)',
  })
  @ApiResponse({ status: 200, description: 'ดาวน์โหลดไฟล์ CSV' })
  async exportCsv(@Res() res: Response) {
    const orgs = await this.organizationsService.findAll();

    // Convert orgs to CSV string
    const csvHeader = 'ID,Name,Tax ID,Status,Created At\n';
    const csvRows = orgs
      .map(
        (org) =>
          `"${org.id}","${org.name.replace(/"/g, '""')}","${org.tax_id}","${org.is_active ? 'Active' : 'Inactive'}","${org.created_at}"`,
      )
      .join('\n');
    const csvData = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="organizations_export.csv"',
    );
    res.send(csvData);
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  @ApiOperation({ summary: 'ดึงรายละเอียดข้อมูลองค์กรด้วยรหัส ID' })
  @ApiParam({ name: 'id', description: 'รหัสประจำองค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดข้อมูลองค์กรสำเร็จ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'แก้ไขข้อมูลองค์กรด้วยรหัส ID' })
  @ApiParam({ name: 'id', description: 'รหัสประจำองค์กรที่ต้องการแก้ไข' })
  @ApiResponse({ status: 200, description: 'อัปเดตข้อมูลองค์กรสำเร็จ' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateData);
  }

  @Get(':id/annual-report')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'ดึงรายงานสรุปคาร์บอนประจำปีขององค์กร' })
  @ApiParam({ name: 'id', description: 'รหัสประจำองค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดข้อมูลรายงานสำเร็จ' })
  getAnnualReport(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.getAnnualReport(id);
  }

  // --- Organization Units ---

  @Post(':orgId/units')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'เพิ่มหน่วยงานย่อย/สาขาให้กับองค์กร' })
  @ApiParam({ name: 'orgId', description: 'รหัสประจำองค์กร' })
  @ApiResponse({ status: 201, description: 'เพิ่มหน่วยงานย่อยสำเร็จ' })
  createUnit(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Body() unitData: any,
  ) {
    return this.organizationsService.createUnit(orgId, unitData);
  }

  @Get(':orgId/units')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  @ApiOperation({ summary: 'ดึงข้อมูลรายการหน่วยงานย่อย/สาขาทั้งหมดขององค์กร' })
  @ApiParam({ name: 'orgId', description: 'รหัสประจำองค์กร' })
  @ApiResponse({ status: 200, description: 'โหลดข้อมูลหน่วยงานย่อยสำเร็จ' })
  findUnits(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.organizationsService.findUnitsByOrg(orgId);
  }

  @Patch('units/:id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'แก้ไขข้อมูลหน่วยงานย่อย/สาขา' })
  @ApiParam({ name: 'id', description: 'รหัสของหน่วยงานย่อยที่ต้องการแก้ไข' })
  @ApiResponse({ status: 200, description: 'อัปเดตหน่วยงานย่อยสำเร็จ' })
  updateUnit(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.organizationsService.updateUnit(id, updateData);
  }

  @Delete('units/:id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'ลบหน่วยงานย่อย/สาขาออกจากระบบ' })
  @ApiParam({ name: 'id', description: 'รหัสของหน่วยงานย่อยที่ต้องการลบ' })
  @ApiResponse({ status: 200, description: 'ลบหน่วยงานย่อยสำเร็จ' })
  removeUnit(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.removeUnit(id);
  }
}
