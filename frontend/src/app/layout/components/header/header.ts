import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  notificationService = inject(NotificationService);

  @Output() toggleSidebarEvent = new EventEmitter<void>();

  user: any = null;
  username = 'Guest';
  role = 'Visitor';
  unreadNotifications = 0;
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        console.log('[DEBUG] Header currentUser updated:', user);
        this.user = user;
        this.username = user?.username || 'Guest';
        this.role = user?.role || 'Visitor';
        console.log('[DEBUG] Header role mapped to:', this.role);
        if (user) {
          this.fetchUnreadCount();
        }
      })
    );

    this.subscription.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadNotifications = count;
      })
    );
  }

  fetchUnreadCount() {
    this.notificationService.updateUnreadCount();
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
