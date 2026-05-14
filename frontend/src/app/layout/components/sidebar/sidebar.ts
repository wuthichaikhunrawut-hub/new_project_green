import { Component, inject, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
  router = inject(Router);

  @Input() isCollapsed = false;
  
  // Mobile menu state
  mobileMenuOpen = false;

  user: any = null;
  private subscription: Subscription = new Subscription();

  // Dropdown open states
  carbonOpen = true;
  aiOpen = false;
  assessmentOpen = false;
  orgOpen = false;

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
      })
    );
    // Auto-expand sections based on active route
    const url = this.router.url;
    if (url.includes('/carbon')) this.carbonOpen = true;
    if (url.includes('/ai-scan')) this.aiOpen = true;
    if (url.includes('/green-office') || url.includes('/assessment')) this.assessmentOpen = true;
    if (url.includes('/org') || url.includes('/assessor/profile') || url.includes('/subscription')) this.orgOpen = true;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /** Normalise the role string from backend into a clean category */
  get roleKey(): string {
    const r = String(this.user?.role || '').trim();
    if (['System Admin', 'SYSTEM_ADMIN', 'ADMIN'].includes(r)) return 'SYSTEM_ADMIN';
    if (['Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(r)) return 'ORG_ADMIN';
    if (['Assessor', 'ASSESSOR'].includes(r)) return 'ASSESSOR';
    if (['Executive', 'EXECUTIVE'].includes(r)) return 'EXECUTIVE';
    if (['Employee', 'EMPLOYEE'].includes(r)) return 'EMPLOYEE';
    if (['User', 'USER'].includes(r)) return 'USER';
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
    return this.user?.username || this.user?.email?.split('@')[0] || 'User';
  }

  get isSystemAdmin(): boolean { return this.roleKey === 'SYSTEM_ADMIN'; }
  get isOrgAdmin(): boolean { return this.roleKey === 'ORG_ADMIN'; }
  get isAnyAdmin(): boolean { return this.isSystemAdmin || this.isOrgAdmin; }
  get isAssessor(): boolean { return this.roleKey === 'ASSESSOR'; }
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

  toggle(section: 'carbon' | 'ai' | 'assessment' | 'org') {
    if (section === 'carbon') this.carbonOpen = !this.carbonOpen;
    else if (section === 'ai') this.aiOpen = !this.aiOpen;
    else if (section === 'assessment') this.assessmentOpen = !this.assessmentOpen;
    else if (section === 'org') this.orgOpen = !this.orgOpen;
  }
}
