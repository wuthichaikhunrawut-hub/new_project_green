import { ToastService } from '../services/toast.service';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((error) => {
      console.error('🚨 Error Intercepted:', error);
      
      // จัดการ 401 Unauthorized - token หมดอายุหรือไม่ถูกต้อง
      if (error.status === 401) {
        if (isPlatformBrowser(platformId)) {
          console.warn('🔐 401 Unauthorized - Redirecting to login');
          // ลบ token และ user data ที่ไม่ถูกต้อง
          authService.logout();
          // Redirect ไป login
          router.navigate(['/login']);
        } else {
          console.warn('🔐 401 Unauthorized on Server - Ignoring redirect and suppressing error to prevent SSR crash');
          return EMPTY;
        }
      }
      
      // If we are on the server and it's any other error, also suppress it to prevent SSR crash
      if (!isPlatformBrowser(platformId)) {
         return EMPTY;
      }
      
      // ตรงนี้ใส่ Logic แจ้งเตือน Alert สวยๆ ได้
      // this.toast.error('เกิดข้อผิดพลาด: ' + error.message);
      return throwError(() => error);
    })
  );
};
