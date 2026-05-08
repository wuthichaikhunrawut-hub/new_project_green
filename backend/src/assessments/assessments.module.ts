import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from './entities/assessment.entity';
import { EvidenceFile } from './entities/evidence-file.entity';
import { AssessmentDetail } from './entities/assessment-detail.entity';
import { GreenCriteriaMaster } from './entities/green-criteria-master.entity';
import { Certificate } from './entities/certificate.entity';
import { GreenCriteriaController } from './green-criteria.controller';
import { GreenOfficeController } from './green-office.controller';
import { GreenOfficeDataController } from './green-office-data.controller';
import { GreenCriteriaService } from './green-criteria.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment, 
      AssessmentDetail, 
      GreenCriteriaMaster, 
      EvidenceFile,
      Certificate
    ]),
    AuditLogsModule
  ],
  controllers: [AssessmentsController, GreenCriteriaController, GreenOfficeController, GreenOfficeDataController],
  providers: [AssessmentsService, GreenCriteriaService],
  exports: [AssessmentsService, GreenCriteriaService],
})
export class AssessmentsModule {}
