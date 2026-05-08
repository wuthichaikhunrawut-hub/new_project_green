import { Controller, Get, Put, Param, Body, Headers } from '@nestjs/common';
import { GreenCriteriaService } from '../assessments/green-criteria.service';

@Controller('green-office')
export class GreenOfficeController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  findAll(@Headers('x-org-id') orgId?: string) {
    return this.greenCriteriaService.findAll();
  }

  @Put(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return { success: true, criteriaId: id, score };
  }
}
