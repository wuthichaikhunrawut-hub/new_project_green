import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  show(title: string, message?: string, variant: ToastVariant = 'info', durationMs = 4000): void {
    const id = ++this.counter;
    const toast: ToastMessage = { id, title, message, variant };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(title: string, message?: string): void {
    this.show(title, message, 'success');
  }

  error(title: string, message?: string): void {
    this.show(title, message, 'error', 6000);
  }

  warning(title: string, message?: string): void {
    this.show(title, message, 'warning');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
