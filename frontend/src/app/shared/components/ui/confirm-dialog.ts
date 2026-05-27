import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 modal-backdrop"
        style="background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        (click)="onBackdropClick()"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 modal-panel"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-lg font-bold text-slate-900">{{ title }}</h3>
          <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ message }}</p>
          <div class="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              (click)="cancel.emit()"
            >{{ cancelLabel }}</button>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl font-semibold text-white transition-colors"
              [class]="confirmClass"
              (click)="confirm.emit()"
            >{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop { animation: fade-in 0.2s ease-out; }
      .modal-panel { animation: scale-in 0.25s ease-out; }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'ยืนยัน';
  @Input() message = '';
  @Input() confirmLabel = 'ยืนยัน';
  @Input() cancelLabel = 'ยกเลิก';
  @Input() variant: 'primary' | 'danger' = 'primary';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get confirmClass(): string {
    return this.variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-emerald-600 hover:bg-emerald-700';
  }

  onBackdropClick(): void {
    this.cancel.emit();
  }
}
