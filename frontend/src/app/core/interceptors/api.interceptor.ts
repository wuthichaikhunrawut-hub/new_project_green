import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // If running on Server-Side (SSR)
  if (!isPlatformBrowser(platformId)) {
    // Local SSR must keep localhost. Containerized SSR can opt into an internal URL.
    const runtimeProcess = (
      globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
      }
    ).process;
    const internalApiUrl = runtimeProcess?.env?.['API_INTERNAL_URL'] || environment.apiUrl;

    if (internalApiUrl !== environment.apiUrl && req.url.startsWith(environment.apiUrl)) {
      const cloned = req.clone({
        url: req.url.replace(environment.apiUrl, internalApiUrl),
      });
      return next(cloned);
    }
  }

  return next(req);
};
