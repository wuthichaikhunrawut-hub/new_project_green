import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatLog } from './entities/gemini.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatLog]), SubscriptionsModule],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
