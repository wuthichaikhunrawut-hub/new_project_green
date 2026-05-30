import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarbonLogsService } from './carbon-logs.service';
import { CarbonLogsController } from './carbon-logs.controller';
import { CarbonLog } from './entities/carbon-log.entity';
import { EmissionFactor } from './entities/emission-factor.entity';
import { EmissionFactorsService } from './emission-factors.service';
import { EmissionFactorsController } from './emission-factors.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarbonLog, EmissionFactor]),
    AuditLogsModule,
  ],
  providers: [CarbonLogsService, EmissionFactorsService],
  controllers: [CarbonLogsController, EmissionFactorsController],
  exports: [CarbonLogsService, EmissionFactorsService],
})
export class CarbonLogsModule {}
