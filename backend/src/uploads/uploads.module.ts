import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EvidenceFile])],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
