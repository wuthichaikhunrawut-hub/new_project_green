import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true, // ✅ Required for Stripe Webhook Signature Verification
  });

  // ✅ Security: HTTP headers
  app.use(helmet());

  // ✅ Performance: Compression (Gzip)
  app.use(compression());

  // ✅ Validation: Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // strip out fields that are not in DTO
    forbidNonWhitelisted: true, // throw error if extra fields are provided
    transform: true, // automatically transform payloads to DTO instances
  }));

  // ✅ Security: เพิ่ม body size limit ป้องกัน Payload ขนาดใหญ่ผิดปกติ
  app.use(require('express').json({ limit: '5mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '5mb' }));

  // ✅ Security: ปรับ CORS ให้เหมาะสมกับ Production
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://greensync.com']
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-org-id, x-user-role, x-user-id',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running at http://localhost:${port}`);
}
bootstrap();
