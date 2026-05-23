import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // We only want to log 500 errors to Sentry, not 400s (validation errors)
        const status = error.getStatus ? error.getStatus() : 500;
        if (status >= 500) {
          Sentry.captureException(error);
        }
        return throwError(() => error);
      }),
    );
  }
}
