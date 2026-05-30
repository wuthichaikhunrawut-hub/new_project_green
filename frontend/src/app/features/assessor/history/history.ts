import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
import { AssessorAssignmentItem } from '../../../core/models/assessor.model';

@Component({
  selector: 'app-assessor-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class AssessorHistoryComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly uploadService = inject(UploadService);

  history: AssessorAssignmentItem[] = [];
  isLoading = true;

  // Certificate Modal
  isCertModalOpen = false;
  certModalItem: AssessorAssignmentItem | null = null;
  certNo = '';
  issuedAt = '';
  expiredAt = '';
  certFileUrl = '';
  uploadedFileName = '';
  isUploading = false;
  isSavingCert = false;

  // Filters
  searchTerm = '';
  statusFilter = '';
  yearFilter = '';
  sortBy: 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' = 'date_desc';

  // Stats
  get totalApproved(): number { return this.history.filter(h => h.status === 'APPROVED').length; }
  get totalRejected(): number { return this.history.filter(h => h.status === 'REJECTED').length; }
  get avgScore(): number {
    const scored = this.history.filter(h => h.totalScore > 0);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((s, h) => s + h.totalScore, 0) / scored.length);
  }
  get availableYears(): number[] {
    return Array.from(new Set(this.history.map(h => h.assessmentYear))).sort((a, b) => b - a);
  }

  get filteredHistory(): AssessorAssignmentItem[] {
    let items = this.history.filter(item => {
      const matchSearch = !this.searchTerm ||
        item.orgName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchYear = !this.yearFilter || String(item.assessmentYear) === this.yearFilter;
      return matchSearch && matchStatus && matchYear;
    });

    switch (this.sortBy) {
      case 'date_asc':
        items = items.slice().sort((a, b) =>
          new Date(a.submittedAt ?? 0).getTime() - new Date(b.submittedAt ?? 0).getTime());
        break;
      case 'date_desc':
        items = items.slice().sort((a, b) =>
          new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime());
        break;
      case 'score_desc':
        items = items.slice().sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'score_asc':
        items = items.slice().sort((a, b) => a.totalScore - b.totalScore);
        break;
    }
    return items;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.assessorService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดประวัติไม่สำเร็จ');
        this.cdr.markForCheck();
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.yearFilter = '';
  }

  printReport(item: AssessorAssignmentItem): void {
    // Open evaluate page in new tab and trigger print
    const url = `/assessor/report/${item.id}`;
    const win = window.open(url, '_blank');
  }

  exportCsv(): void {
    const rows = [
      ['ลำดับ', 'ชื่อองค์กร', 'ปีประเมิน', 'สถานะ', 'คะแนนรวม', 'ระดับการรับรอง', 'Carbon รวม (tCO₂e)'],
      ...this.filteredHistory.map((h, i) => [
        String(i + 1),
        h.orgName,
        String(h.assessmentYear),
        this.statusLabel(h.status),
        String(h.totalScore),
        this.certLevel(h.totalScore),
        String(h.carbonSummary?.totalEmission?.toFixed(2) ?? '0'),
      ])
    ];

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessor-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ',
      REVISION_REQUESTED: 'รอแก้ไข',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
      REVISION_REQUESTED: 'badge-revision',
    };
    return map[status] ?? '';
  }

  certLevel(score: number): string {
    if (score >= 90) return 'ทอง (Gold)';
    if (score >= 70) return 'เงิน (Silver)';
    if (score >= 50) return 'ทองแดง (Bronze)';
    if (score > 0) return 'ไม่ผ่านเกณฑ์';
    return '-';
  }

  certEmoji(score: number): string {
    if (score >= 90) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 50) return '🥉';
    if (score > 0) return '❌';
    return '—';
  }

  certClass(score: number): string {
    if (score >= 90) return 'cert-gold';
    if (score >= 70) return 'cert-silver';
    if (score >= 50) return 'cert-bronze';
    return 'cert-none';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  openCertModal(item: AssessorAssignmentItem): void {
    this.certModalItem = item;
    this.certNo = '';
    this.issuedAt = '';
    this.expiredAt = '';
    this.certFileUrl = '';
    this.uploadedFileName = '';
    this.isCertModalOpen = true;

    // Load existing certificate details
    this.assessorService.getAssessment(item.id).subscribe({
      next: (fullAssessment) => {
        if (fullAssessment.certificates && fullAssessment.certificates.length > 0) {
          const cert = fullAssessment.certificates[0];
          this.certNo = cert.certificate_no || '';
          this.certFileUrl = cert.certificate_url || '';
          if (cert.certificate_url) {
            const parts = cert.certificate_url.split('/');
            this.uploadedFileName = parts[parts.length - 1];
          }
          
          if (cert.issued_at) {
            this.issuedAt = new Date(cert.issued_at).toISOString().split('T')[0];
          }
          if (cert.expired_at) {
            this.expiredAt = new Date(cert.expired_at).toISOString().split('T')[0];
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Failed to load certificate details', err)
    });
  }

  closeCertModal(): void {
    this.isCertModalOpen = false;
    this.certModalItem = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedFileName = file.name;
      this.isUploading = true;
      this.cdr.markForCheck();

      this.uploadService.uploadFile(file, 'certificates').subscribe({
        next: (res) => {
          this.certFileUrl = res.file_url || res.url || '';
          this.isUploading = false;
          this.toast.success('อัปโหลดไฟล์ใบรับรองสำเร็จ');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUploading = false;
          this.toast.error('อัปโหลดไฟล์ใบรับรองล้มเหลว');
          this.cdr.markForCheck();
        }
      });
    }
  }

  removeUploadedFile(event: Event): void {
    event.stopPropagation();
    this.certFileUrl = '';
    this.uploadedFileName = '';
  }

  saveCertificate(): void {
    if (!this.certModalItem) return;
    this.isSavingCert = true;
    this.assessorService.updateCertificate(this.certModalItem.id, {
      certificate_no: this.certNo || undefined,
      issued_at: this.issuedAt || undefined,
      expired_at: this.expiredAt || undefined,
      certificate_url: this.certFileUrl || undefined
    }).subscribe({
      next: () => {
        this.toast.success('บันทึกข้อมูลใบรับรองเรียบร้อยแล้ว');
        this.isSavingCert = false;
        this.closeCertModal();
        this.load(); // Refresh to update status
      },
      error: () => {
        this.toast.error('ไม่สามารถบันทึกใบรับรองได้');
        this.isSavingCert = false;
        this.cdr.markForCheck();
      }
    });
  }
}

