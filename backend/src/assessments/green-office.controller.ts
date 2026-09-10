import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('green-office')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GreenOfficeController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  private getOrgId(req: any): number {
    const role = req.user?.role;
    if (['SYSTEM_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN'].includes(role)) {
      const orgId = Number(req.headers['x-org-id'] ?? 0);
      if (!orgId) throw new BadRequestException('กรุณาระบุองค์กร');
      return orgId;
    }
    const orgId = Number(req.user?.orgId);
    if (!orgId) throw new BadRequestException('ไม่พบข้อมูลองค์กรในบัญชีผู้ใช้');
    return orgId;
  }

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'ASSESSOR', 'ASSESSOR_ADMIN')
  async findAll(@Req() req: any) {
    const results = await this.greenCriteriaService.findAllForFrontend(
      this.getOrgId(req),
    );
    return results.map((r) => ({
      ...r,
      max_score: r.maxScore,
      current_score: r.currentScore,
    }));
  }

  @Put(':id/score')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
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
}
