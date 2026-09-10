import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
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

  private getOrgId(req: any): number {
    if (req.user?.role !== 'SYSTEM_ADMIN') {
      const orgId = Number(req.user?.orgId);
      if (!orgId)
        throw new BadRequestException('ไม่พบข้อมูลองค์กรในบัญชีผู้ใช้');
      return orgId;
    }
    const orgId = Number(req.headers['x-org-id'] ?? 0);
    return Number.isFinite(orgId) ? orgId : 0;
  }

  @Get()
  findAll(@Req() req: any) {
    return this.greenCriteriaService.findAll(this.getOrgId(req));
  }

  @Get('list')
  findAllForFrontend(@Req() req: any) {
    return this.greenCriteriaService.findAllForFrontend(this.getOrgId(req));
  }

  @Post()
  @Roles('SYSTEM_ADMIN')
  create(@Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.create(data);
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN')
  update(@Param('id') id: string, @Body() data: Partial<GreenCriteriaMaster>) {
    return this.greenCriteriaService.update(+id, data);
  }

  @Put(':id/score')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'EMPLOYEE', 'USER')
  updateScore(
    @Param('id') id: string,
    @Body('score') score: number,
    @Req() req?: any,
  ) {
    return this.greenCriteriaService.updateScore(
      +id,
      score,
      this.getOrgId(req),
    );
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN')
  remove(@Param('id') id: string) {
    return this.greenCriteriaService.remove(+id);
  }
}
