import { Controller, Get, Put, Param, Body, Headers, UseGuards } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('green-office')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GreenOfficeController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'ASSESSOR', 'ASSESSOR_ADMIN')
  async findAll(@Headers('x-org-id') orgId?: string) {
    let numericOrgId = 0;
    if (orgId) {
      numericOrgId = parseInt(orgId, 10);
      if (isNaN(numericOrgId)) numericOrgId = 0;
    }
    const results = await this.greenCriteriaService.findAllForFrontend(numericOrgId);
    return results.map(r => ({
      ...r,
      max_score: r.maxScore,
      current_score: r.currentScore
    }));
  }

  @Put(':id/score')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  updateScore(
    @Param('id') id: string,
    @Body('score') score: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    let numericOrgId = 0;
    if (orgId) {
      numericOrgId = parseInt(orgId, 10);
      if (isNaN(numericOrgId)) numericOrgId = 0;
    }
    return this.greenCriteriaService.updateScore(+id, score, numericOrgId);
  }
}
