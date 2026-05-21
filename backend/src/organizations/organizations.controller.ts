import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createData: CreateOrganizationDto) {
    return this.organizationsService.create(createData);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateData);
  }

  // --- Organization Units ---

  @Post(':orgId/units')
  createUnit(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Body() unitData: any,
  ) {
    return this.organizationsService.createUnit(orgId, unitData);
  }

  @Get(':orgId/units')
  findUnits(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.organizationsService.findUnitsByOrg(orgId);
  }

  @Patch('units/:id')
  updateUnit(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.organizationsService.updateUnit(id, updateData);
  }

  @Delete('units/:id')
  removeUnit(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.removeUnit(id);
  }
}
