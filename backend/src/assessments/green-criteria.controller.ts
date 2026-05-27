import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/green-criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GreenCriteriaController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  findAll(@Headers() headers: any) {
    const orgIdStr = headers['x-org-id'];
    let orgId = 0;
    if (orgIdStr) {
      orgId = parseInt(orgIdStr, 10);
      if (isNaN(orgId)) orgId = 0;
    }
    return this.greenCriteriaService.findAll(orgId);
  }

  @Get('list')
  findAllForFrontend(@Headers() headers: any) {
    const orgIdStr = headers['x-org-id'];
    let orgId = 0;
    if (orgIdStr) {
      orgId = parseInt(orgIdStr, 10);
      if (isNaN(orgId)) orgId = 0;
    }
    return this.greenCriteriaService.findAllForFrontend(orgId);
  }

  @Post()
  create(@Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.update(+id, data);
  }

  @Put(':id/score')
  updateScore(
    @Param('id') id: string,
    @Body('score') score: number,
    @Headers('x-org-id') orgIdStr?: string,
  ) {
    let orgId = 0;
    if (orgIdStr) {
      orgId = parseInt(orgIdStr, 10);
      if (isNaN(orgId)) orgId = 0;
    }
    return this.greenCriteriaService.updateScore(+id, score, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.greenCriteriaService.remove(+id);
  }
}
