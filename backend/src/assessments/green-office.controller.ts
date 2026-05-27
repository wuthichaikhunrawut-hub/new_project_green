import { Controller, Get, Put, Param, Body, Headers } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';

@Controller('green-office')
export class GreenOfficeController {
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

  @Put(':id/score')
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
