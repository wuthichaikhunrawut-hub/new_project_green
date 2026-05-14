import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    // 1. Check Hardcoded Roles (from Decorator)
    if (requiredRoles) {
      const normalize = (r: string) => String(r || '').trim().toUpperCase().replace(/[\s_]/g, '');
      const userRole = normalize(user.role);
      const hasRole = requiredRoles.some((role) => normalize(role) === userRole);
      if (hasRole) return true;
    }

    // 2. Check Dynamic Permissions (from Feature Decorator)
    const featureCode = this.reflector.get<string>('feature', context.getHandler());
    if (featureCode) {
      const settingKey = `permission.${featureCode.toLowerCase()}`;
      const settings = await this.settingsService.getAllSettings();
      const value = settings[settingKey];

      if (value) {
        try {
          const allowedRoles = JSON.parse(value);
          if (Array.isArray(allowedRoles)) {
            return allowedRoles.includes(user.role);
          }
          return value === user.role;
        } catch {
          return value === user.role;
        }
      }
    }

    // If neither decorator nor dynamic permission allows it, deny
    return !requiredRoles && !featureCode;
  }
}
