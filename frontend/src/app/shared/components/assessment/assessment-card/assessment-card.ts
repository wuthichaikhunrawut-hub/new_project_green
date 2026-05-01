import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoreSelectorComponent } from '../score-selector/score-selector';
import { EvidenceUploadComponent } from '../evidence-upload/evidence-upload';

@Component({
  selector: 'app-assessment-card',
  standalone: true,
  imports: [CommonModule, ScoreSelectorComponent, EvidenceUploadComponent],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      <!-- Card Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
        <div class="flex gap-4">
          <div class="shrink-0 w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
            <span class="text-sm font-black text-white">{{ questionId }}</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 leading-tight mb-1">{{ title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{{ description }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                [class]="statusClass">
            {{ statusLabel }}
          </span>
          <div class="text-sm font-bold text-slate-400">
            คะแนนที่ได้: <span class="text-green-600 text-lg">{{ score || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-5 flex flex-col gap-6">
        <!-- Implementation Status -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะการดำเนินการ</label>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let state of implementationStates"
              (click)="onStateChange(state.value)"
              class="px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all flex items-center gap-2"
              [class.border-green-600]="implementationStatus === state.value"
              [class.bg-green-50]="implementationStatus === state.value"
              [class.text-green-700]="implementationStatus === state.value"
              [class.border-slate-200]="implementationStatus !== state.value"
              [class.bg-white]="implementationStatus !== state.value"
              [class.text-slate-500]="implementationStatus !== state.value"
              [class.hover:border-green-200]="implementationStatus !== state.value"
            >
              <i [class]="state.icon"></i>
              {{ state.label }}
            </button>
          </div>
        </div>

        <!-- Score Selector -->
        <app-score-selector [score]="score" (scoreChange)="onScoreChange($event)"></app-score-selector>

        <!-- Description Textarea -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">คำอธิบาย / วิธีดำเนินการ</label>
          <textarea
            (input)="onDetailsChange($event)"
            [value]="details || ''"
            rows="3"
            placeholder="โปรดระบุรายละเอียดการดำเนินการที่สอดคล้องกับหัวข้อนี้..."
            class="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
          ></textarea>
        </div>

        <!-- Evidence Upload -->
        <app-evidence-upload
          [fileCount]="fileCount"
          (filesSelected)="onFilesSelected($event)"
          (filesCleared)="onFilesCleared()"
        ></app-evidence-upload>
      </div>

      <!-- Footer Info -->
      <div *ngIf="score === 5 && fileCount === 0" class="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
        <span class="text-xs font-semibold text-amber-700">คำเตือน: ต้องแนบหลักฐานอย่างน้อย 1 ไฟล์ สำหรับระดับคะแนนเต็ม (5)</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AssessmentCardComponent {
  @Input() questionId: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() implementationStatus: string = 'none';
  @Input() score: number | null = null;
  @Input() details: string = '';
  @Input() fileCount: number = 0;

  @Output() changed = new EventEmitter<any>();

  implementationStates = [
    { value: 'none', label: 'ยังไม่มีการดำเนินการ', icon: 'fa-solid fa-circle-xmark', color: 'slate' },
    { value: 'partial', label: 'ดำเนินการบางส่วน', icon: 'fa-solid fa-circle-half-stroke', color: 'amber' },
    { value: 'complete', label: 'ดำเนินการครบถ้วน', icon: 'fa-solid fa-circle-check', color: 'green' }
  ];

  get statusLabel(): string {
    if (this.score !== null && this.implementationStatus !== 'none') return 'เสร็จสมบูรณ์';
    if (this.implementationStatus !== 'none' || this.details) return 'กำลังดำเนินการ';
    return 'ยังไม่เริ่ม';
  }

  get statusClass(): string {
    const label = this.statusLabel;
    if (label === 'เสร็จสมบูรณ์') return 'bg-green-100 text-green-700 border border-green-200';
    if (label === 'กำลังดำเนินการ') return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-slate-100 text-slate-500 border border-slate-200';
  }

  onStateChange(value: string) {
    this.implementationStatus = value;
    this.emitChange();
  }

  onScoreChange(value: number) {
    this.score = value;
    this.emitChange();
  }

  onDetailsChange(event: any) {
    this.details = event.target.value;
    this.emitChange();
  }

  onFilesSelected(files: FileList) {
    this.fileCount += files.length;
    this.emitChange();
  }

  onFilesCleared() {
    this.fileCount = 0;
    this.emitChange();
  }

  private emitChange() {
    this.changed.emit({
      implementationStatus: this.implementationStatus,
      score: this.score,
      details: this.details,
      fileCount: this.fileCount,
      status: this.statusLabel
    });
  }
}
