import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);

  @Output() toggleSidebarEvent = new EventEmitter<void>();

  user: any = null;
  username = 'Guest';
  role = 'Visitor';
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        console.log('[DEBUG] Header currentUser updated:', user);
        this.user = user;
        this.username = user?.username || 'Guest';
        this.role = user?.role || 'Visitor';
        console.log('[DEBUG] Header role mapped to:', this.role);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
