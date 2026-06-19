import { ToastService } from '../../core/services/toast.service';
import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, BillScanResult } from '../../services/gemini';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
import { EmissionFactorsService, EmissionFactor } from '../../core/services/emission-factors.service';
@Component({
  selector: 'app-ai-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-scan.html',
  styleUrl: './ai-scan.css'
})
export class AiScanComponent implements OnInit {
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private factorsService = inject(EmissionFactorsService);

  factors: EmissionFactor[] = [];
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

  ngOnInit() {
    this.factorsService.getFactors().subscribe({
      next: (data) => {
        this.factors = data;
      },
      error: (err) => {
        console.error('Failed to load emission factors:', err);
      }
    });
  }

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

  private mapActivityType(aiType: string): string {
    if (!aiType) return 'Electricity';
    const typeLower = aiType.toLowerCase();
    
    if (typeLower.includes('ไฟ')) {
      return 'Electricity';
    }
    if (typeLower.includes('น้ำประปา') || typeLower.includes('ประปา') || (typeLower.includes('น้ำ') && !typeLower.includes('น้ำมัน'))) {
      return 'Water';
    }
    if (typeLower.includes('น้ำมัน') || typeLower.includes('เชื้อเพลิง') || typeLower.includes('ก๊าซ') || typeLower.includes('แก๊ส') || typeLower.includes('fuel')) {
      return 'Fuel';
    }
    
    return 'Electricity';
  }

  private mapUnit(aiUnit: string, type: string): string {
    if (!aiUnit) {
      return type === 'Electricity' ? 'kWh' : (type === 'Water' ? 'หน่วย' : 'ลิตร');
    }
    const unitLower = aiUnit.toLowerCase();
    if (unitLower.includes('kwh') || unitLower.includes('กิโลวัตต์')) {
      return 'kWh';
    }
    if (unitLower.includes('ลิตร') || unitLower.includes('litre') || unitLower.includes('l')) {
      return 'ลิตร';
    }
    if (unitLower.includes('หน่วย') || unitLower.includes('ลบ.ม') || unitLower.includes('ม3') || unitLower.includes('m3')) {
      return 'หน่วย';
    }
    return type === 'Electricity' ? 'kWh' : (type === 'Water' ? 'หน่วย' : 'ลิตร');
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
          const mappedType = this.mapActivityType(result.type);
          this.formData.type = mappedType;
          this.formData.amount = result.amount || this.formData.amount;
          this.formData.unit = this.mapUnit(result.unit, mappedType);
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

  parseThaiDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().substring(0, 10);
    
    const cleanStr = dateStr.trim().toLowerCase();
    
    // 1. Try to check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return cleanStr;
    }
    
    // 2. Try to match slash formats like "MM/YY" or "MM/YYYY" or "MM-YYYY" or "MM/BE"
    const slashMatch = cleanStr.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
    if (slashMatch) {
      let month = parseInt(slashMatch[1], 10);
      let year = parseInt(slashMatch[2], 10);
      
      if (year < 100) {
        if (year >= 50) {
          year = 2500 + year - 543;
        } else {
          year = 2000 + year;
        }
      } else if (year > 2400) {
        year = year - 543;
      }
      
      if (month >= 1 && month <= 12) {
        const mm = String(month).padStart(2, '0');
        return `${year}-${mm}-01`;
      }
    }

    // 3. Thai month mapping
    const thaiMonths = [
      { name: 'มกราคม', abbr: 'ม.ค.', value: 1 },
      { name: 'กุมภาพันธ์', abbr: 'ก.พ.', value: 2 },
      { name: 'มีนาคม', abbr: 'มี.ค.', value: 3 },
      { name: 'เมษายน', abbr: 'เม.ย.', value: 4 },
      { name: 'พฤษภาคม', abbr: 'พ.ค.', value: 5 },
      { name: 'มิถุนายน', abbr: 'มิ.ย.', value: 6 },
      { name: 'กรกฎาคม', abbr: 'ก.ค.', value: 7 },
      { name: 'สิงหาคม', abbr: 'ส.ค.', value: 8 },
      { name: 'กันยายน', abbr: 'ก.ย.', value: 9 },
      { name: 'ตุลาคม', abbr: 'ต.ค.', value: 10 },
      { name: 'พฤศจิกายน', abbr: 'พ.ย.', value: 11 },
      { name: 'ธันวาคม', abbr: 'ธ.ค.', value: 12 }
    ];

    let foundMonth = 0;
    for (const m of thaiMonths) {
      if (cleanStr.includes(m.name) || cleanStr.includes(m.abbr)) {
        foundMonth = m.value;
        break;
      }
    }
    
    if (foundMonth === 0) {
      const engMonths = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const engAbbrs = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ];
      for (let i = 0; i < 12; i++) {
        if (cleanStr.includes(engMonths[i]) || cleanStr.includes(engAbbrs[i])) {
          foundMonth = i + 1;
          break;
        }
      }
    }

    if (foundMonth === 0) {
      foundMonth = new Date().getMonth() + 1;
    }

    let foundYear = new Date().getFullYear();
    const fourDigitMatch = cleanStr.match(/\b(25\d{2}|20\d{2})\b/);
    if (fourDigitMatch) {
      const yr = parseInt(fourDigitMatch[1], 10);
      if (yr >= 2500) {
        foundYear = yr - 543;
      } else {
        foundYear = yr;
      }
    } else {
      const twoDigitMatch = cleanStr.match(/\b(\d{2})\b$/);
      if (twoDigitMatch) {
        let yr = parseInt(twoDigitMatch[1], 10);
        if (yr >= 50) {
          foundYear = 2500 + yr - 543;
        } else {
          foundYear = 2000 + yr;
        }
      }
    }

    const mm = String(foundMonth).padStart(2, '0');
    return `${foundYear}-${mm}-01`;
  }

  isSaving = false;

  confirmSave() {
    this.isSaving = true;
    this.cdr.markForCheck();
    
    if (this.selectedFile) {
      this.carbonService.uploadFile(this.selectedFile, 'carbon', 'หมวดที่ 3').subscribe({
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
    const formattedDate = this.parseThaiDate(this.formData.date);
    
    let factor = 0;
    const type = this.formData.type;
    if (type === 'Electricity') {
      const match = this.factors.find(f => f.name.includes('Electricity') || f.name.includes('ไฟฟ้า'));
      factor = match ? match.factor_value : 0.4999;
    } else if (type === 'Water') {
      const match = this.factors.find(f => f.name.includes('Water') || f.name.includes('น้ำประปา'));
      factor = match ? match.factor_value : 0.337;
    } else if (type === 'Fuel') {
      const match = this.factors.find(f => f.name.includes('Diesel') || f.name.includes('ดีเซล') || f.name.includes('น้ำมันดีเซล'));
      factor = match ? match.factor_value : 2.7086;
    }
    const calculatedEmission = (this.formData.amount || 0) * factor;

    const log: CarbonLog = {
      date: formattedDate,
      type: this.formData.type,
      amount: this.formData.amount || 0,
      unit: this.formData.unit,
      emission: calculatedEmission,
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
