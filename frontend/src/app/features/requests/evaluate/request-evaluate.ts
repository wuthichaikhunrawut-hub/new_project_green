import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService, CertificationRequest } from '../../../core/services/requests.service';
import { ThaiDatePipe } from '../../../shared/pipes/thai-date-pipe';

@Component({
  selector: 'app-request-evaluate',
  standalone: true,
  imports: [CommonModule, FormsModule, ThaiDatePipe],
  templateUrl: './request-evaluate.html',
  styleUrl: './request-evaluate.css'
})
export class RequestEvaluateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private requestsService = inject(RequestsService);
  private cdr = inject(ChangeDetectorRef);

  request: CertificationRequest | null = null;
  isLoading = true;
  isSaving = false;
  overallComment = '';
  
  get canEdit(): boolean {
    return this.request?.status !== 'APPROVED' && this.request?.status !== 'REJECTED';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequest(id);
    } else {
      this.goBack();
    }
  }

  loadRequest(id: string) {
    this.isLoading = true;
    this.requestsService.getRequestById(id).subscribe({
      next: (data: CertificationRequest) => {
        this.request = data;
        
        // Ensure details is an array if we expect it to be
        if (!Array.isArray(this.request.details)) {
          this.request.details = [];
        }

        // Initialize assessor fields and mock evidence links if they don't exist
        this.request.details.forEach((item: any, index: number) => {
          item.assessor_score = item.assessor_score || 0;
          item.auditor_comment = item.auditor_comment || '';

          // FR-12: Mock evidence documents based on category index for demo purposes
          if (!item.evidence_files || item.evidence_files.length === 0) {
            item.evidence_files = [
              { name: `เอกสารหลักฐานหมวด_${index + 1}_1.pdf`, url: `https://fake-storage.com/evidence_${index + 1}_1.pdf` },
              { name: `รูปภาพประกอบ_${index + 1}_2.jpg`, url: `https://fake-storage.com/evidence_${index + 1}_2.jpg` }
            ];
          }
        });

        this.overallComment = this.request.notes || '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load request:', err);
        alert('ไม่พบข้อมูลคำร้องนี้');
        this.goBack();
      }
    });
  }

  calculateTotalAssessorScore(): number {
    if (!this.request || !this.request.details) return 0;
    return this.request.details.reduce((sum: number, item: any) => sum + (Number(item.assessor_score) || 0), 0);
  }

  calculateTotalMaxScore(): number {
    if (!this.request || !this.request.details) return 0;
    return this.request.details.reduce((sum: number, item: any) => sum + (Number(item.criteria?.max_score) || 5), 0);
  }

  // FR-14: Calculate percentage and matching certification level (Gold, Silver, Bronze)
  getCertificationLevel(): { level: string, percent: number, color: string } {
    const totalScore = this.calculateTotalAssessorScore();
    const maxScore = this.calculateTotalMaxScore();
    
    if (maxScore === 0) return { level: 'ไม่มีเกณฑ์ประเมิน', percent: 0, color: 'text-muted' };

    const percent = Math.round((totalScore / maxScore) * 100);

    if (percent >= 90) return { level: 'G (ทอง)', percent, color: 'text-warning' }; // Gold
    if (percent >= 80) return { level: 'S (เงิน)', percent, color: 'text-secondary' }; // Silver
    if (percent >= 60) return { level: 'B (ทองแดง)', percent, color: 'text-danger' }; // Bronze
    return { level: 'ไม่ผ่านเกณฑ์', percent, color: 'text-dark' };
  }

  saveDraft() {
    this.saveData();
  }

  exportToPdf() {
    window.print();
  }

  updateStatus(status: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED') {
    if (!confirm('ยืนยันส่งผลการประเมินให้องค์กรใช่หรือไม่?')) return;
    this.saveData(status);
  }

  private saveData(newStatus?: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED') {
    if (!this.request || !this.request.id) return;
    this.isSaving = true;

    const finalStatus = newStatus || (this.request.status as 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED' | 'PENDING');
    const finalLevel = finalStatus === 'APPROVED' ? this.getCertificationLevel().level : undefined;
    const finalScore = this.calculateTotalAssessorScore();

    const updatePayload: Partial<CertificationRequest> = {
      status: finalStatus,
      notes: this.overallComment,
      total_score: finalScore,
      certified_level: finalLevel,
      details: (this.request.details || []).map((d: any) => ({
        assessment_detail_id: d.id,
        assessor_score: d.assessor_score,
        auditor_comment: d.auditor_comment
      }))
    };

    this.requestsService.updateRequest(this.request.id.toString(), updatePayload).subscribe({
      next: () => {
        alert(newStatus ? 'ส่งผลการประเมินเรียบร้อยแล้ว' : 'บันทึกร่างข้อมูลสำเร็จแล้ว');
        this.isSaving = false;
        if (newStatus) {
            this.goBack();
        }
      },
      error: (err: any) => {
        console.error('Failed to update request:', err);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        this.isSaving = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
