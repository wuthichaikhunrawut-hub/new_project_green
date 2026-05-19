import { Controller, Get, Headers } from '@nestjs/common';
import { GreenCriteriaService } from './green-criteria.service';

@Controller('green-office')
export class GreenOfficeDataController {
  constructor(private readonly greenCriteriaService: GreenCriteriaService) {}

  @Get()
  async findAll(@Headers('x-org-id') orgId?: string) {
    const criteria = await this.greenCriteriaService.findAll();

    // Transform data to match frontend model
    return criteria.map((item) => ({
      id: item.id,
      category: item.category_number,
      code: item.criteria_code,
      name: item.criteria_name,
      maxScore: item.max_score,
      currentScore: 0, // Default to 0
      status: 'Pending' as const,
    }));
  }
}
