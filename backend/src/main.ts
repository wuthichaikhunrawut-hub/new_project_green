import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true, // ✅ Required for Stripe Webhook Signature Verification
  });

  // ✅ Security: HTTP headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.getHttpAdapter().getInstance().disable('x-powered-by');

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

  // ✅ Monitoring: Sentry Error Tracking (Only if DSN is provided)
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      profilesSampleRate: 1.0,
    });
    app.useGlobalInterceptors(new SentryInterceptor());
  }

  // ✅ Security: ปรับ CORS ให้เหมาะสมกับ Production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-org-id, x-user-role, x-user-id',
  });

  // ✅ Documentation: Swagger API Docs
  const config = new DocumentBuilder()
    .setTitle('Green Sync API')
    .setDescription('The official API documentation for Green Sync.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running at http://localhost:${port}`);
}
bootstrap();
