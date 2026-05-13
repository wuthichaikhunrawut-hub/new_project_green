import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }
    
    // Normalize role comparison (remove spaces and underscores)
    const normalize = (r: string) => String(r || '').trim().toUpperCase().replace(/[\s_]/g, '');
    const userRole = normalize(user.role);
    const hasRole = requiredRoles.some((role) => normalize(role) === userRole);
    
    console.log(`[RolesGuard] User Role: "${user.role}" -> "${userRole}"`);
    console.log(`[RolesGuard] Required Roles: ${JSON.stringify(requiredRoles)}`);
    console.log(`[RolesGuard] Access: ${hasRole ? 'ALLOWED' : 'DENIED'}`);
    
    return hasRole;
  }
}
