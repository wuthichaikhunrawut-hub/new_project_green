import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true; // อนุญาตให้ผ่านไปก่อนระหว่างทำ SSR เพื่อไม่ให้โดนดีดไปหน้า Login
  }

  if (authService.isAuthenticated()) {
    return true; // ยอมให้ผ่าน
  } else {
    router.navigate(['/login']); // ดีดกลับไปหน้า Login
    return false;
  }
};