import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatLog } from './entities/gemini.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatLog])],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
