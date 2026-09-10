import { PLATFORM_ID } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  it('adds the access token in one central place for browser requests', async () => {
    localStorage.setItem('access_token', 'test-token');
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, url: request.url })),
    );

    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        jwtInterceptor(new HttpRequest('GET', '/api/test'), next),
      ),
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer test-token');
    localStorage.removeItem('access_token');
  });

  it('does not attach browser credentials while rendering on the server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, url: request.url })),
    );

    await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        jwtInterceptor(new HttpRequest('GET', '/api/test'), next),
      ),
    );

    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  });
});
