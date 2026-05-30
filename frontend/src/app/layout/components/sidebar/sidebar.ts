import { Component, inject, Input, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AssessorService } from '../../../core/services/assessor.service';
import { UsersService } from '../../../core/services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private assessorService = inject(AssessorService);
  private usersService = inject(UsersService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() isCollapsed = false;

  // Mobile menu state
  mobileMenuOpen = false;

  user: any = null;
  pendingCount = 0;
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        
        // Dynamic profile fetch: If user_profile name is not populated in the current session,
        // fetch full user details from backend to retrieve the real name (e.g. วีระเดช)
        if (user && user.id) {
          this.usersService.getUser(user.id).subscribe({
            next: (fullUser) => {
              if (fullUser && fullUser.user_profile && fullUser.user_profile.first_name) {
                this.user = {
                  ...this.user,
                  user_profile: fullUser.user_profile,
                  username: fullUser.username
                };
                this.cdr.markForCheck();
              }
            },
            error: (err) => console.warn('Sidebar failed to fetch full user profile dynamically', err)
          });
        }

        // Load pending count for assessor badge
        if (user && this.isAssessor) {
          this.loadPendingCount();
        }
        this.cdr.markForCheck();
      })
    );
  }

  loadPendingCount(): void {
    this.assessorService.getDashboard().subscribe({
      next: (data) => {
        this.pendingCount = (data.stats.pending ?? 0) + (data.stats.inReview ?? 0);
        this.cdr.markForCheck();
      },
      error: () => { 
        this.pendingCount = 0; 
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get roleKey(): string {
    const r = String(this.user?.role || '').trim().toUpperCase().split(' ').join('_');
    if (r === 'SYSTEM_ADMIN' || r === 'ADMIN') return 'SYSTEM_ADMIN';
    if (r === 'ORGANIZATION_ADMIN' || r === 'ORG_ADMIN') return 'ORG_ADMIN';
    if (r === 'ASSESSOR') return 'ASSESSOR';
    if (r === 'ASSESSOR_ADMIN') return 'ASSESSOR_ADMIN';
    if (r === 'EXECUTIVE') return 'EXECUTIVE';
    if (r === 'EMPLOYEE') return 'EMPLOYEE';
    if (r === 'USER') return 'USER';
    return '';
  }

  get initials(): string {
    if (this.user?.user_profile?.first_name) {
      return this.user.user_profile.first_name.charAt(0).toUpperCase();
    }
    return (this.user?.username || this.user?.email || 'G').charAt(0).toUpperCase();
  }

  get displayName(): string {
    if (this.user?.user_profile?.first_name) {
      const first = this.user.user_profile.first_name;
      const last = this.user.user_profile.last_name || '';
      return `${first} ${last}`.trim();
    }
    
    // Return username or email split handle as fallback name (e.g. user02)
    return this.user?.username || this.user?.email?.split('@')[0] || 'ผู้ใช้งาน';
  }

  get isSystemAdmin(): boolean { return this.roleKey === 'SYSTEM_ADMIN'; }
  get isOrgAdmin(): boolean { return this.roleKey === 'ORG_ADMIN'; }
  get isAnyAdmin(): boolean { return this.isSystemAdmin || this.isOrgAdmin; }
  get isAssessor(): boolean { return this.roleKey === 'ASSESSOR' || this.roleKey === 'ASSESSOR_ADMIN'; }
  get isAssessorAdmin(): boolean { return this.roleKey === 'ASSESSOR_ADMIN'; }
  get isExecutive(): boolean { return this.roleKey === 'EXECUTIVE'; }
  get isEmployee(): boolean { return this.roleKey === 'EMPLOYEE'; }
  /** User or Employee or Executive — regular org members */
  get isOrgMember(): boolean {
    return ['USER', 'EMPLOYEE', 'EXECUTIVE', 'ORG_ADMIN'].includes(this.roleKey);
  }

  hasRole(roles: string[]): boolean {
    return roles.includes(this.roleKey);
  }

  // Mobile menu toggle
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  // Close menu on route change
  onNavItemClick() {
    if (window.innerWidth <= 991) {
      this.mobileMenuOpen = false;
    }
  }

  // Close on escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: any) {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  // Close on resize to desktop
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth > 991 && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }


}
