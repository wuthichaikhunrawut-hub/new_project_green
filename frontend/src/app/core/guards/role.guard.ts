import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true; // Allow server-side rendering to proceed, we will handle 401s without redirecting
    }

    const user = this.authService.getUser();
    
    // Not authenticated, let authGuard (if any) or login page handle it
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { role } = user;

    // Check allowed roles from route data
    const allowedRoles: string[] = route.data['roles'] || [];

    // If no specific roles required, allow access
    if (allowedRoles.length === 0) {
      return true;
    }

    const normalizeRole = (value: string): string => {
      const val = String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
      if (val === 'ORGADMIN' || val === 'ORGANIZATIONADMIN') {
        return 'ORGANIZATIONADMIN';
      }
      if (val === 'SYSTEMADMIN' || val === 'ADMIN') {
        return 'SYSTEMADMIN';
      }
      return val;
    };

    const userRole = normalizeRole(String(role));
    const allowed = allowedRoles.map((r) => normalizeRole(r));

    if (allowed.includes(userRole)) {
      return true;
    }

    if (userRole === 'ASSESSORADMIN' && (allowed.includes('ASSESSOR') || allowed.includes('SYSTEMADMIN'))) {
      return true;
    }

    const legacyRole = String(role).toUpperCase().trim().split(' ').join('_');
    if (allowedRoles.map((r) => r.toUpperCase()).includes(legacyRole)) {
      return true;
    }

    // Role is not allowed. Redirect based on role.
    const normalizedRole = String(role).toUpperCase().trim().split(' ').join('_');
    switch (normalizedRole) {
      case 'SYSTEM_ADMIN':
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'ORG_ADMIN':
      case 'ORGANIZATION_ADMIN':
        this.router.navigate(['/dashboard']);
        break;
      case 'ASSESSOR':
      case 'ASSESSOR_ADMIN':
        this.router.navigate(['/assessor/dashboard']);
        break;
      case 'EXECUTIVE':
        this.router.navigate(['/executive/dashboard']);
        break;
      case 'EMPLOYEE':
      case 'USER':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
    return false;
  }
}
