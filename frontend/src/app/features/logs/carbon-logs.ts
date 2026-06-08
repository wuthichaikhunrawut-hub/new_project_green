import { ToastService } from '../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
import { ThaiDatePipe } from '../../shared/pipes/thai-date-pipe';
import { OrgBranchesService, OrgBranch } from '../../core/services/org-branches.service';
import { AuthService } from '../../core/services/auth.service';
import { EmissionFactorsService, EmissionFactor } from '../../core/services/emission-factors.service';
import { UserSubscriptionsService } from '../../core/services/user-subscriptions.service';

import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog';

@Component({
  selector: 'app-carbon-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThaiDatePipe, ConfirmDialogComponent],
  templateUrl: './carbon-logs.html',
  styleUrl: './carbon-logs.css'
})
export class CarbonLogsComponent implements OnInit {
  private toast = inject(ToastService);
  private carbonService = inject(CarbonService);
  private cdr = inject(ChangeDetectorRef);
  private branchService = inject(OrgBranchesService);
  private authService = inject(AuthService);
  private factorsService = inject(EmissionFactorsService);
  private subscriptionService = inject(UserSubscriptionsService);

  logs: CarbonLog[] = [];
  isLoading = false;
  lastUpdatedAt: Date | null = null;
  branches: OrgBranch[] = [];
  selectedUnitId: number | null = null;
  
  factors: EmissionFactor[] = [];
  selectedFactorId: number | null = null;
  filteredFactorsForForm: EmissionFactor[] = [];
  
  quotaWarnings: string[] = [];

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
  filterBranchId: number | 'ALL' = 'ALL';

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

  showManualModal = false;
  isScanning = false;
  isUploading = false;

  openManualModal() {
    this.showManualModal = true;
    this.cdr.markForCheck();
  }

  closeManualModal() {
    this.showManualModal = false;
    this.cdr.markForCheck();
  }

  ngOnInit() {
    this.fetchLogs();
    const orgId = this.authService.getOrganizationId();
    if (orgId) {
      this.branchService.getBranches(orgId).subscribe({
        next: (res) => { this.branches = res; },
        error: () => { /* ไม่บังคับ */ }
      });
    }

    this.factorsService.getFactors().subscribe({
      next: (res) => {
        this.factors = res || [];
        this.onActivityTypeChanged();
      },
      error: (err) => console.error('Failed to load emission factors', err)
    });

    this.subscriptionService.getMyQuotas().subscribe({
      next: (quotas) => {
        this.quotaWarnings = [];
        (quotas || []).forEach((q: any) => {
          const used = q.used || 0;
          const limit = q.limit || 0;
          const featName = q.feature_name || q.feature_code || 'โควตา';
          if (limit > 0) {
            const usagePercent = (used / limit) * 100;
            if (usagePercent >= 80) {
              this.quotaWarnings.push(
                `แจ้งเตือนสิทธิ์การใช้งาน: คุณใช้โควตาสำหรับ "${featName}" ไปแล้ว ${usagePercent.toFixed(0)}% (${used}/${limit})`
              );
            }
          }
        });
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load quotas for warning', err)
    });
  }

  onActivityTypeChanged() {
    const type = this.newEntry.activity_type;
    this.selectedFactorId = null;
    
    if (type === 'Electricity') {
      this.filteredFactorsForForm = this.factors.filter(f => f.scope === 2 || f.unit?.toLowerCase() === 'kwh' || f.name?.includes('ไฟฟ้า'));
    } else if (type === 'Water') {
      this.filteredFactorsForForm = this.factors.filter(f => f.unit?.toLowerCase().includes('m3') || f.unit?.includes('m³') || f.name?.includes('น้ำประปา'));
    } else if (type === 'Gasoline') {
      this.filteredFactorsForForm = this.factors.filter(f => f.scope === 1 || f.unit?.toLowerCase() === 'liter' || f.unit?.toLowerCase() === 'litre' || f.name?.includes('น้ำมัน'));
    } else {
      this.filteredFactorsForForm = [];
    }

    if (this.filteredFactorsForForm.length > 0) {
      this.selectedFactorId = Number(this.filteredFactorsForForm[0].id);
    }
    this.cdr.markForCheck();
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
      if (this.filterBranchId !== 'ALL' && l.org_unit_id !== this.filterBranchId) return false;

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

    if (typeof e === 'number' && e >= 10) return `การใช้ไฟฟ้าเพิ่มขึ้น ${e.toFixed(0)}%`;
    if (typeof w === 'number' && w >= 10) return `การใช้น้ำเพิ่มขึ้น ${w.toFixed(0)}%`;
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
            this.newEntry.activity_type = 'Electricity';
            this.toast.success(`AI ตรวจพบปริมาณการใช้: ${res.amount}`);
          }
        },
        error: () => {
          this.isScanning = false;
          this.toast.error('เกิดข้อผิดพลาดในการแปลผล AI');
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
        error: () => {
          this.isUploading = false;
          this.toast.error('ไม่สามารถอัพโหลดไฟล์หลักฐานได้');
        }
      });
    }
  }

  removeEvidenceFile(fileInput: HTMLInputElement) {
    this.newEntry.evidence_url = '';
    this.newEntry.evidence_file = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  saveLog() {
    if (!this.newEntry.activity_type || !this.newEntry.usage_amount) {
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Find the chosen factor
    const factorObj = this.factors.find(f => Number(f.id) === this.selectedFactorId);
    const factorVal = factorObj ? factorObj.factor_value : 0.5; // fallback
    const unit = factorObj ? factorObj.unit : 'kWh';

    const calculatedEmission = this.newEntry.usage_amount * factorVal;

    const payload: any = {
      date: `${this.newEntry.year}-${String(this.newEntry.month).padStart(2, '0')}-01`,
      type: this.newEntry.activity_type,
      amount: this.newEntry.usage_amount,
      unit: unit,
      emission: calculatedEmission,
      source: 'MANUAL',
      evidence_url: this.newEntry.evidence_url,
      org_unit_id: this.selectedUnitId ?? undefined,
      emission_factor_id: this.selectedFactorId ?? undefined
    };

    this.carbonService.addLog(payload).subscribe({
      next: () => {
        this.toast.success('บันทึกข้อมูลเรียบร้อยแล้ว!');
        this.fetchLogs();
        this.newEntry = {
          activity_type: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          usage_amount: 0,
          evidence_file: null,
          evidence_url: ''
        };
        this.selectedUnitId = null;
        this.selectedFactorId = null;
        this.closeManualModal();
      },
      error: () => {
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }

  confirmOpen = false;
  logIdToDelete: string | null = null;

  deleteLog(id: string | undefined) {
    if (!id) return;
    this.logIdToDelete = id;
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  onDeleteCancel(): void {
    this.confirmOpen = false;
    this.logIdToDelete = null;
    this.cdr.markForCheck();
  }

  onDeleteConfirm(): void {
    if (!this.logIdToDelete) return;
    this.confirmOpen = false;
    this.carbonService.deleteLog(this.logIdToDelete).subscribe({
      next: () => {
        this.toast.success('ลบรายการคาร์บอนเรียบร้อยแล้ว');
        this.fetchLogs();
      },
      error: () => {
        this.toast.error('เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้');
      }
    });
    this.logIdToDelete = null;
  }
}