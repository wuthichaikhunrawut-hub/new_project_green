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

    // Normalize role name for comparison
    const normalizedRole = String(role).toUpperCase().replace(' ', '_');

    if (allowedRoles.map(r => r.toUpperCase()).includes(normalizedRole)) {
      return true;
    }

    // Role is not allowed. Redirect based on role.
    switch (normalizedRole) {
      case 'SYSTEM_ADMIN':
      case 'ORG_ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'ASSESSOR':
        this.router.navigate(['/assessor/dashboard']);
        break;
      case 'EXECUTIVE':
        this.router.navigate(['/dashboard']);
        break;
      case 'EMPLOYEE':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
    return false;
  }
}
