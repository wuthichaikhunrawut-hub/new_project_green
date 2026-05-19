import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl border shadow-lg px-4 py-3 toast-enter"
          [ngClass]="variantClass(toast.variant)"
          role="status"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-sm">{{ toast.title }}</p>
              @if (toast.message) {
                <p class="text-xs mt-1 opacity-90">{{ toast.message }}</p>
              }
            </div>
            <button
              type="button"
              class="text-current opacity-60 hover:opacity-100 text-lg leading-none shrink-0"
              (click)="toastService.dismiss(toast.id)"
              aria-label="ปิด"
            >×</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-enter {
        animation: toast-slide 0.35s ease-out;
      }
      @keyframes toast-slide {
        from { transform: translateX(1rem); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
  ],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  variantClass(variant: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      error: 'bg-red-50 border-red-200 text-red-900',
      warning: 'bg-amber-50 border-amber-200 text-amber-900',
      info: 'bg-slate-50 border-slate-200 text-slate-900',
    };
    return map[variant] ?? map['info'];
  }
}
