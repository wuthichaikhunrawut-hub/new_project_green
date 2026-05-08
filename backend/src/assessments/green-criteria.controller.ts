import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';

@Controller('admin/green-criteria')
// @UseGuards(AdminRoleGuard)
export class GreenCriteriaController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  findAll() {
    return this.greenCriteriaService.findAll();
  }

  @Get('list')
  findAllForFrontend() {
    return this.greenCriteriaService.findAllForFrontend();
  }

  @Post()
  create(@Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.greenCriteriaService.remove(+id);
  }
}
