import { ToastService } from '../../core/services/toast.service';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, BillScanResult } from '../../services/gemini';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
@Component({
  selector: 'app-ai-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-scan.html',
  styleUrl: './ai-scan.css'
})
export class AiScanComponent {
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isProcessing = false;
  scanResult: BillScanResult | null = null;
  errorMessage: string | null = null;

  // Form Model
  formData = {
    type: 'Electricity', // Default
    amount: null as number | null,
    unit: 'kWh', // Default
    date: ''
  };

  constructor(
    private geminiService: GeminiService,
    private carbonService: CarbonService
  ) {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.scanResult = null;
      this.errorMessage = null;
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  processAi() {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.geminiService.uploadBill(this.selectedFile).subscribe({
      next: (result: BillScanResult) => {
        this.isProcessing = false;
        this.scanResult = result;
        
        // Auto-fill form data from AI result
        if (result) {
          this.formData.type = result.type || this.formData.type;
          this.formData.amount = result.amount || this.formData.amount;
          this.formData.unit = result.unit || this.formData.unit;
          this.formData.date = result.date || this.formData.date;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('AI scan failed:', err);
        this.isProcessing = false;
        this.errorMessage = err?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        this.cdr.markForCheck();
      }
    });
  }

  isSaving = false;

  confirmSave() {
    this.isSaving = true;
    this.cdr.markForCheck();
    
    if (this.selectedFile) {
      this.carbonService.uploadFile(this.selectedFile, 'carbon').subscribe({
        next: (res) => this.saveToBackend(res.url),
        error: (err) => {
          this.isSaving = false;
          this.toast.error('อัปโหลดไฟล์หลักฐานไม่สำเร็จ');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.saveToBackend();
    }
  }

  private saveToBackend(evidenceUrl?: string) {
    const log: CarbonLog = {
      date: new Date().toISOString(), // In real app, parse this.formData.date
      type: this.formData.type,
      amount: this.formData.amount || 0,
      unit: this.formData.unit,
      emission: 0,
      source: 'AI Scan',
      evidence_url: evidenceUrl
    };

    this.carbonService.addLog(log).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('บันทึกข้อมูลเข้าสู่ระบบเรียบร้อย!');
        this.reset();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  reset() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.scanResult = null;
    this.errorMessage = null;
    // Reset Form Data
    this.formData = {
      type: 'Electricity',
      amount: null,
      unit: 'kWh',
      date: ''
    };
    this.cdr.markForCheck();
  }
}
