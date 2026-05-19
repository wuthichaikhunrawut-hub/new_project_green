import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
import { ThaiDatePipe } from '../../shared/pipes/thai-date-pipe';

@Component({
  selector: 'app-carbon-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThaiDatePipe],
  templateUrl: './carbon-logs.html',
  styleUrl: './carbon-logs.css'
})
export class CarbonLogsComponent implements OnInit {
  private carbonService = inject(CarbonService);
  private cdr = inject(ChangeDetectorRef);

  logs: CarbonLog[] = [];
  isLoading = false;
  lastUpdatedAt: Date | null = null;
  
  // Real Statistics
  monthlyElectricity = 0;
  monthlyWater = 0;
  totalEmission = 0;
  activityCount = 0;

  prevMonthlyElectricity = 0;
  prevMonthlyWater = 0;
  prevTotalEmission = 0;

  searchQuery = '';
  filterType: 'ALL' | 'Electricity' | 'Water' | 'Gasoline' = 'ALL';
  filterSource: 'ALL' | 'AI_OCR' | 'MANUAL' = 'ALL';

  page = 1;
  pageSize = 8;

  newEntry = {
    activity_type: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    usage_amount: 0,
    evidence_file: null as File | null,
    evidence_url: ''
  };

  isScanning = false;
  isUploading = false;

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading = true;
    this.carbonService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.page = 1;
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
        const prevMonth = prevMonthDate.getMonth() + 1;
        const prevYear = prevMonthDate.getFullYear();

        // Calculate Stats
        this.monthlyElectricity = data
          .filter(l => l.type === 'Electricity' && l.date.includes(`${currentYear}-${String(currentMonth).padStart(2, '0')}`))
          .reduce((sum, l) => sum + l.amount, 0);

        this.monthlyWater = data
          .filter(l => l.type === 'Water' && l.date.includes(`${currentYear}-${String(currentMonth).padStart(2, '0')}`))
          .reduce((sum, l) => sum + l.amount, 0);

        this.prevMonthlyElectricity = data
          .filter(l => l.type === 'Electricity' && l.date.includes(`${prevYear}-${String(prevMonth).padStart(2, '0')}`))
          .reduce((sum, l) => sum + l.amount, 0);

        this.prevMonthlyWater = data
          .filter(l => l.type === 'Water' && l.date.includes(`${prevYear}-${String(prevMonth).padStart(2, '0')}`))
          .reduce((sum, l) => sum + l.amount, 0);

        this.totalEmission = data.reduce((sum, l) => sum + l.emission, 0);
        this.prevTotalEmission = data
          .filter(l => l.date.includes(`${prevYear}-${String(prevMonth).padStart(2, '0')}`))
          .reduce((sum, l) => sum + l.emission, 0);

        this.activityCount = data.length;
        this.lastUpdatedAt = new Date();
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load logs', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredLogs(): CarbonLog[] {
    const q = this.searchQuery.trim().toLowerCase();
    return (this.logs || []).filter((l) => {
      const type = this.normalizeType(l.type);
      const source = this.normalizeSource(l.source);

      if (this.filterType !== 'ALL' && type !== this.filterType) return false;
      if (this.filterSource !== 'ALL' && source !== this.filterSource) return false;

      if (!q) return true;
      const hay = `${type} ${l.unit} ${source} ${l.amount} ${l.emission} ${l.date}`.toLowerCase();
      return hay.includes(q);
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredLogs.length / this.pageSize));
  }

  get pagedLogs(): CarbonLog[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  goToPage(next: number) {
    const clamped = Math.max(1, Math.min(this.pageCount, next));
    this.page = clamped;
  }

  onFilterChanged() {
    this.page = 1;
  }

  get electricityTrendPercent(): number | null {
    return this.computeTrendPercent(this.monthlyElectricity, this.prevMonthlyElectricity);
  }

  get waterTrendPercent(): number | null {
    return this.computeTrendPercent(this.monthlyWater, this.prevMonthlyWater);
  }

  get emissionTrendPercent(): number | null {
    return this.computeTrendPercent(this.totalEmission, this.prevTotalEmission);
  }

  get aiInsightTitle(): string {
    const e = this.electricityTrendPercent;
    const w = this.waterTrendPercent;

    if (typeof e === 'number' && e >= 10) return `à¸à¸²à¸£à¹ƒà¸Šà¹‰à¹„à¸Ÿà¸Ÿà¹‰à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸‚à¸¶à¹‰à¸™ ${e.toFixed(0)}%`;
    if (typeof w === 'number' && w >= 10) return `à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸™à¹‰à¸³à¹€à¸žà¸´à¹ˆà¸¡à¸‚à¸¶à¹‰à¸™ ${w.toFixed(0)}%`;
    return 'AI Insight';
  }

  get aiInsightMessage(): string {
    const e = this.electricityTrendPercent;
    const w = this.waterTrendPercent;

    if (typeof e === 'number' && e >= 10) {
      return 'แนะนำให้ตรวจสอบตารางเวลา HVAC/แสงสว่างหลัง 18:00 และตั้งค่าอุณหภูมิแอร์ให้เหมาะสมเพื่อลด Peak Load';
    }
    if (typeof w === 'number' && w >= 10) {
      return 'พบแนวโน้มการใช้น้ำสูงขึ้นผิดปกติ แนะนำให้ตรวจสอบการรั่วไหล และติดตั้งอุปกรณ์ประหยัดน้ำในจุดใช้งานหลัก';
    }
    return 'แนวโน้มการใช้งานอยู่ในระดับปกติ แนะนำให้ติดตามต่อเนื่องและเก็บหลักฐานให้ครบเพื่อใช้ในการตรวจประเมิน';
  }

  private computeTrendPercent(current: number, previous: number): number | null {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  private normalizeType(type: string): CarbonLogsComponent['filterType'] {
    const t = (type || '').toLowerCase();
    if (t.includes('electric')) return 'Electricity';
    if (t.includes('water')) return 'Water';
    if (t.includes('gasoline') || t.includes('diesel') || t.includes('fuel') || t.includes('oil')) return 'Gasoline';
    return 'ALL';
  }

  private normalizeSource(source: string): CarbonLogsComponent['filterSource'] {
    const s = (source || '').toLowerCase();
    if (s.includes('ai')) return 'AI_OCR';
    if (s.includes('manual')) return 'MANUAL';
    return 'ALL';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isScanning = true;
      this.carbonService.scanBill(file).subscribe({
        next: (res) => {
          this.isScanning = false;
          if (res.amount) {
            this.newEntry.usage_amount = res.amount;
            this.newEntry.activity_type = 'Electricity'; // default assume PEA for now
            alert(`AI ตรวจพบปริมาณการใช้: ${res.amount}`);
          }
        },
        error: (err) => {
          this.isScanning = false;
          alert('เกิดข้อผิดพลาดในการแปลผล AI');
        }
      });
    }
  }

  onEvidenceFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = true;
      this.carbonService.uploadFile(file, 'evidence').subscribe({
        next: (res) => {
          this.isUploading = false;
          this.newEntry.evidence_url = res.url;
        },
        error: (err) => {
          this.isUploading = false;
          alert('ไม่สามารถอัพโหลดไฟล์หลักฐานได้');
        }
      });
    }
  }

  saveLog() {
    if (!this.newEntry.activity_type || !this.newEntry.usage_amount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    let unit = '';
    let factor = 0;
    
    if (this.newEntry.activity_type === 'Electricity') { unit = 'kWh'; factor = 0.5; } 
    else if (this.newEntry.activity_type === 'Water') { unit = 'm3'; factor = 0.3; } 
    else if (this.newEntry.activity_type === 'Gasoline') { unit = 'Litre'; factor = 2.3; }

    const calculatedEmission = this.newEntry.usage_amount * factor;

    const payload: CarbonLog = {
      date: `${this.newEntry.year}-${String(this.newEntry.month).padStart(2, '0')}-01`,
      type: this.newEntry.activity_type,
      amount: this.newEntry.usage_amount,
      unit: unit,
      emission: calculatedEmission,
      source: 'MANUAL',
      evidence_url: this.newEntry.evidence_url
    };

    this.carbonService.addLog(payload).subscribe({
      next: (res) => {
        alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
        this.fetchLogs(); // refresh table
        // Reset Form
        this.newEntry = {
          activity_type: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          usage_amount: 0,
          evidence_file: null,
          evidence_url: ''
        };
        document.getElementById('closeModalBtn')?.click();
      },
      error: (err) => {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }

  deleteLog(id: string | undefined) {
    if (!id) return;
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
      this.carbonService.deleteLog(id).subscribe({
        next: () => {
          this.fetchLogs(); // refresh table
        },
        error: (err) => {
          alert('เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้');
        }
      });
    }
  }
}