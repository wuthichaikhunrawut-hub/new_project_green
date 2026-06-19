import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 'ข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message =
          (res as any).message || (res as any).error || exception.message;
      } else {
        message = res || exception.message;
      }
    }

    // Log the actual error stack trace for server monitoring
    const logData = {
      path: request.url,
      method: request.method,
      statusCode: status,
      body: request.body,
      query: request.query,
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `🚨 Internal Exception at ${request.method} ${request.url}:`,
        exception instanceof Error ? exception.stack : JSON.stringify(logData),
      );

      // Capture 500 error in Sentry if initialized
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception);
      }
    } else {
      this.logger.warn(
        `⚠️ Http Warning ${status} at ${request.method} ${request.url}: ${JSON.stringify(message)}`,
      );
    }

    // Return unified error response
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
