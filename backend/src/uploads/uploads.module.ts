import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';

import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvidenceFile]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
