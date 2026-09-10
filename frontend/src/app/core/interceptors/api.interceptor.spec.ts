import { HttpRequest, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  const runtimeProcess = (
    globalThis as typeof globalThis & {
      process: { env: Record<string, string | undefined> };
    }
  ).process;
  const originalInternalUrl = runtimeProcess.env['API_INTERNAL_URL'];

  afterEach(() => {
    if (originalInternalUrl === undefined) delete runtimeProcess.env['API_INTERNAL_URL'];
    else runtimeProcess.env['API_INTERNAL_URL'] = originalInternalUrl;
  });

  it('keeps the local API URL during local SSR', async () => {
    delete runtimeProcess.env['API_INTERNAL_URL'];
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, url: request.url })),
    );
    const request = new HttpRequest('GET', `${environment.apiUrl}/subscriptions/plans`);

    await firstValueFrom(TestBed.runInInjectionContext(() => apiInterceptor(request, next)));

    expect(next.mock.calls[0][0].url).toBe(request.url);
  });

  it('uses an explicitly configured internal API URL during container SSR', async () => {
    runtimeProcess.env['API_INTERNAL_URL'] = 'http://backend:3001';
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, url: request.url })),
    );
    const request = new HttpRequest('GET', `${environment.apiUrl}/subscriptions/plans`);

    await firstValueFrom(TestBed.runInInjectionContext(() => apiInterceptor(request, next)));

    expect(next.mock.calls[0][0].url).toBe('http://backend:3001/subscriptions/plans');
  });
});
