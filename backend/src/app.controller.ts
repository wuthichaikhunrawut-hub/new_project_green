import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('green-office')
  getGreenOffice() {
    // Return mock data for now since the service isn't available here
    return [
      {
        id: 1,
        category: "Energy Management",
        criteria: "Use energy-efficient lighting",
        maxScore: 10,
        currentScore: 0
      },
      {
        id: 2,
        category: "Waste Management", 
        criteria: "Implement recycling program",
        maxScore: 10,
        currentScore: 0
      }
    ];
  }

  @Put('green-office/:id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return { success: true, criteriaId: id, score };
  }
}
