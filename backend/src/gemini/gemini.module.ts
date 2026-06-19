import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatLog } from './entities/gemini.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatLog,
      ChatSession,
      ChatMessage,
      User,
      Organization,
    ]),
    SubscriptionsModule,
  ],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
