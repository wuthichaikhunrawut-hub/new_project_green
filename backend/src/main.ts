import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ ปลดล็อก CORS แบบกว้างที่สุดเพื่อให้ Demo ผ่านฉลุย
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-org-id, x-user-role, x-user-id',
  });

  await app.listen(3001, '0.0.0.0');
  console.log('🚀 Backend running at http://localhost:3001');
}
bootstrap();