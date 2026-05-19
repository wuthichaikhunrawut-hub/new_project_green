import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // If running on Server-Side (SSR)
  if (!isPlatformBrowser(platformId)) {
    // Rewrite localhost API calls to use the Docker service name 'backend'
    if (req.url.startsWith('http://localhost:3001')) {
      const cloned = req.clone({
        url: req.url.replace('http://localhost:3001', 'http://backend:3001')
      });
      return next(cloned);
    }
  }

  return next(req);
};
