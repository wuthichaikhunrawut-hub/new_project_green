import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('green-office-data')
@UseGuards(JwtAuthGuard)
export class GreenOfficeDataController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
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
}
