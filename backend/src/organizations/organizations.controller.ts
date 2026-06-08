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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('SYSTEM_ADMIN')
  create(@Body() createData: CreateOrganizationDto) {
    return this.organizationsService.create(createData);
  }

  @Get()
  @Roles('SYSTEM_ADMIN')
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get('export/csv')
  @Roles('SYSTEM_ADMIN')
  async exportCsv(@Res() res: Response) {
    const orgs = await this.organizationsService.findAll();
    
    // Convert orgs to CSV string
    const csvHeader = 'ID,Name,Tax ID,Status,Created At\n';
    const csvRows = orgs.map(org => 
      `"${org.id}","${org.name.replace(/"/g, '""')}","${org.tax_id}","${org.is_active ? 'Active' : 'Inactive'}","${org.created_at}"`
    ).join('\n');
    const csvData = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="organizations_export.csv"');
    res.send(csvData);
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateData);
  }

  @Get(':id/annual-report')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  getAnnualReport(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.getAnnualReport(id);
  }

  // --- Organization Units ---

  @Post(':orgId/units')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  createUnit(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Body() unitData: any,
  ) {
    return this.organizationsService.createUnit(orgId, unitData);
  }

  @Get(':orgId/units')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findUnits(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.organizationsService.findUnitsByOrg(orgId);
  }

  @Patch('units/:id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  updateUnit(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.organizationsService.updateUnit(id, updateData);
  }

  @Delete('units/:id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  removeUnit(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.removeUnit(id);
  }
}
