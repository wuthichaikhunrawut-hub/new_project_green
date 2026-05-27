import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgAdminController } from './org-admin.controller';
import { OrgAdminService } from './org-admin.service';
import { Assessment } from '../assessments/entities/assessment.entity';
import { CarbonLog } from '../carbon-logs/entities/carbon-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assessment, CarbonLog]),
    AuthModule,
  ],
  controllers: [OrgAdminController],
  providers: [OrgAdminService],
})
export class OrgAdminModule {}
