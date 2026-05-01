import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-evidence-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-2">
      <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">แนบหลักฐาน (PDF, รูปภาพ)</label>
      <div class="flex items-center gap-3">
        <label class="cursor-pointer">
          <input type="file" (change)="onFileSelected($event)" multiple class="sr-only">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            เพิ่มไฟล์
          </span>
        </label>
        
        <div *ngIf="fileCount > 0" class="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg">
          <i class="fa-solid fa-file-circle-check text-green-600 text-sm"></i>
          <span class="text-sm font-bold text-green-700">{{ fileCount }} ไฟล์ที่แนบแล้ว</span>
          <button (click)="clearFiles()" class="ml-1 text-slate-400 hover:text-red-500 transition-colors">
            <i class="fa-solid fa-circle-xmark"></i>
          </button>
        </div>
        
        <span *ngIf="fileCount === 0" class="text-sm text-slate-400 italic">ยังไม่มีการแนบไฟล์</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EvidenceUploadComponent {
  @Input() fileCount: number = 0;
  @Output() filesSelected = new EventEmitter<FileList>();
  @Output() filesCleared = new EventEmitter<void>();

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  clearFiles() {
    this.filesCleared.emit();
  }
}
