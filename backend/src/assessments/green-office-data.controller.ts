import {
  BadRequestException,
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('green-office-data')
@UseGuards(JwtAuthGuard)
export class GreenOfficeDataController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  async findAll(@Req() req: any) {
    const privileged = ['SYSTEM_ADMIN', 'ASSESSOR', 'ASSESSOR_ADMIN'].includes(
      req.user?.role,
    );
    const numericOrgId = Number(
      privileged ? req.headers['x-org-id'] : req.user?.orgId,
    );
    if (!numericOrgId) {
      throw new BadRequestException('ไม่พบข้อมูลองค์กร');
    }
    const results =
      await this.greenCriteriaService.findAllForFrontend(numericOrgId);
    return results.map((r) => ({
      ...r,
      max_score: r.maxScore,
      current_score: r.currentScore,
    }));
  }
}
