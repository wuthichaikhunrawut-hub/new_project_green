import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessorController } from './assessor.controller';
import { AssessorService } from './assessor.service';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessmentDetail } from '../assessments/entities/assessment-detail.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { Certificate } from '../assessments/entities/certificate.entity';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      AssessmentDetail,
      CarbonLog,
      Certificate,
    ]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [AssessorController],
  providers: [AssessorService],
  exports: [AssessorService],
})
export class AssessorModule {}
