import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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

    const normalizeRole = (value: string): string =>
      String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');

    const userRole = normalizeRole(String(role));
    const allowed = allowedRoles.map((r) => normalizeRole(r));

    if (allowed.includes(userRole)) {
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
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'ORG_ADMIN':
      case 'ORGANIZATION_ADMIN':
        this.router.navigate(['/org-admin/revision-center']);
        break;
      case 'ASSESSOR':
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
