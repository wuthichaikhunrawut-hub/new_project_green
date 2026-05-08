import { Module } from '@nestjs/common';
import { GreenOfficeController } from './green-office.controller';
import { AssessmentsModule } from '../assessments/assessments.module';

@Module({
  imports: [AssessmentsModule],
  controllers: [GreenOfficeController],
})
export class GreenOfficeModule {}
