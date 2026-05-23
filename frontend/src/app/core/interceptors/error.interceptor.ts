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
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      console.error('🚨 Error Intercepted:', error);
      
      // จัดการ 401 Unauthorized - token หมดอายุหรือไม่ถูกต้อง
      if (error.status === 401) {
        if (isPlatformBrowser(platformId)) {
          console.warn('🔐 401 Unauthorized - Redirecting to login');
          // ลบ token และ user data ที่ไม่ถูกต้อง
          authService.logout();
          toast.error('เซสชันหมดอายุหรือไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
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
      
      // ดึงข้อความแจ้งเตือนจาก API หรือใช้ Default Message
      let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      if (error.error && error.error.message) {
        errorMsg = typeof error.error.message === 'string' ? error.error.message : error.error.message[0];
      } else if (error.message) {
        errorMsg = error.message;
      }

      // แสดง Toast แจ้งเตือนข้อผิดพลาดทุกกรณี (ยกเว้น 401 ที่ดักไปแล้ว)
      if (error.status !== 401 && isPlatformBrowser(platformId)) {
        toast.error(errorMsg);
      }

      return throwError(() => error);
    })
  );
};
