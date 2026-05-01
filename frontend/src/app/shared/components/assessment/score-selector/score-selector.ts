import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2">
      <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ระดับคะแนน (0-5)</label>
      <div class="flex gap-1.5">
        <button
          *ngFor="let s of [0, 1, 2, 3, 4, 5]"
          type="button"
          (click)="selectScore(s)"
          class="w-10 h-10 rounded-lg border-2 font-bold transition-all flex items-center justify-center"
          [class.bg-green-600]="score === s"
          [class.border-green-600]="score === s"
          [class.text-white]="score === s"
          [class.bg-white]="score !== s"
          [class.border-slate-200]="score !== s"
          [class.text-slate-400]="score !== s"
          [class.hover:border-green-200]="score !== s"
          [class.hover:text-green-600]="score !== s"
        >
          {{ s }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ScoreSelectorComponent {
  @Input() score: number | null = null;
  @Output() scoreChange = new EventEmitter<number>();

  selectScore(s: number) {
    this.score = s;
    this.scoreChange.emit(s);
  }
}
