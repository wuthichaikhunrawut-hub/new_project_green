import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

@Controller('test-errors')
class TestErrorsController {
  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('Invalid test input');
  }

  @Get('internal')
  internalError() {
    throw new Error('sensitive internal detail');
  }
}

describe('HTTP transport and global error contract (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, TestErrorsController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => app.close());

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET) exposes only operational liveness data', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'green-sync-api',
      }),
    );
    expect(response.body).not.toHaveProperty('environment');
    expect(response.body).not.toHaveProperty('database');
  });

  it('returns the unified 400 error response', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/bad-request')
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        path: '/test-errors/bad-request',
        message: 'Invalid test input',
      }),
    );
  });

  it('redacts internal error details from 500 responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/internal')
      .expect(500);

    expect(response.body.message).toBe(
      'ข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง',
    );
    expect(JSON.stringify(response.body)).not.toContain(
      'sensitive internal detail',
    );
  });
});
