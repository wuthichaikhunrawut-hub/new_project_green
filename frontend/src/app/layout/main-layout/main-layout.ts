import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../components/sidebar/sidebar';
import { HeaderComponent } from '../components/header/header';
import { AiChatComponent } from '../../shared/components/ai-chat/ai-chat';
import { ToastContainerComponent } from '../../shared/components/ui/toast-container';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, AiChatComponent, ToastContainerComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  
  // ดึงข้อมูล User จาก Database Table 'users' (ผ่าน Service)
  user: any = null;
  private subscription: Subscription = new Subscription();
  
  // สถานะ Sidebar (สำหรับ Desktop/Mobile)
  isCollapsed = false;

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}