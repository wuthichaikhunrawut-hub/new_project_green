import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FEATURE_KEY } from './feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureCode = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!featureCode) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.org_id) {
      // System Admins might not have an org_id but they should bypass package checks
      if (user?.role === 'System Admin') return true;
      throw new ForbiddenException('User organization context missing');
    }

    const hasAccess = await this.subscriptionsService.canAccessFeature(user.org_id, featureCode);
    
    if (!hasAccess) {
      throw new ForbiddenException(`Your subscription plan does not include the ${featureCode} feature.`);
    }

    return true;
  }
}
