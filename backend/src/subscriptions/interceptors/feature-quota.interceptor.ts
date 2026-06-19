import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { FEATURE_CODE_KEY } from '../decorators/feature-code.decorator';

@Injectable()
export class FeatureQuotaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FeatureQuotaInterceptor.name);

  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const featureCode = this.reflector.get<string>(
      FEATURE_CODE_KEY,
      context.getHandler(),
    );

    if (!featureCode) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by JwtAuthGuard

    if (!user || !user.orgId) {
      // If user has no organization, they can't use organizational features
      throw new ForbiddenException('User organization not found.');
    }

    const orgId = Number(user.orgId);

    // 1. Check if plan has the feature
    const hasFeature = await this.subscriptionsService.canAccessFeature(
      orgId,
      featureCode,
    );
    if (!hasFeature) {
      throw new ForbiddenException(
        `Feature ${featureCode} is not included in your current plan.`,
      );
    }

    // 2. Check quota
    const quota = await this.subscriptionsService.checkFeatureQuota(
      orgId,
      featureCode,
    );
    if (!quota.allowed) {
      throw new ForbiddenException(
        `Quota exceeded for feature ${featureCode}. Used: ${quota.used}/${quota.limit}`,
      );
    }

    // 3. Handle request and log usage on success
    return next.handle().pipe(
      tap(() => {
        this.subscriptionsService
          .logFeatureUsage(orgId, featureCode, 1)
          .catch((error) => {
            this.logger.error(
              `Failed to log feature usage for org ${orgId}, feature ${featureCode}`,
              error,
            );
          });
      }),
    );
  }
}
