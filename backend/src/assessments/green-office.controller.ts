import { Controller, Get, Put, Param, Body, Headers } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';

@Controller('green-office')
export class GreenOfficeController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  findAll(@Headers('x-org-id') orgId?: string) {
    let numericOrgId = 0;
    if (orgId) {
      numericOrgId = parseInt(orgId, 10);
      if (isNaN(numericOrgId)) numericOrgId = 0;
    }
    return this.greenCriteriaService.findAll(numericOrgId);
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
