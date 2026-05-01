import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';

@Component({
  selector: 'app-assessor-certification-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './certification-decision.html',
  styles: ``
})
export class AssessorCertificationDecisionComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  requestId = 0;
  requestName = '';
  scoreItems: any[] = [];
  overallComment = '';
  decision = '';
  isSaving = false;
  isLoading = true;

  get totalScore() { return this.scoreItems.reduce((a, i) => a + (i.assessor_score || 0), 0); }
  get totalMaxScore() { return this.scoreItems.reduce((a, i) => a + (i.max_score || 5), 0); }
  get scorePercent() { return this.totalMaxScore > 0 ? (this.totalScore / this.totalMaxScore) * 100 : 0; }



  ngOnInit() {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest();
  }

  loadRequest() {
    this.requestsService.getRequestById(this.requestId.toString()).subscribe({
      next: (req) => {
        this.requestName = req.organization?.name || 'ไม่พบข้อมูล';
        this.overallComment = req.notes || '';
        this.scoreItems = (req.details || []).map((d: any) => ({
          assessment_detail_id: d.id,
          criteria_code: d.criteria?.criteria_code,
          criteria_name: d.criteria?.criteria_name,
          assessor_score: d.assessor_score || 0,
          max_score: d.criteria?.max_score || 5,
          auditor_comment: d.auditor_comment || ''
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  getCertificationLevel(): string {
    if (this.scorePercent >= 90) return 'ระดับ ทอง (Gold)';
    if (this.scorePercent >= 70) return 'ระดับ เงิน (Silver)';
    if (this.scorePercent >= 50) return 'ระดับ ทองแดง (Bronze)';
    return 'ไม่ผ่านการรับรอง';
  }

  saveDraft() { alert('บันทึกร่างแล้ว (Mock)'); }

  submitDecision() {
    if (!this.decision) { alert('กรุณาเลือกผลการตัดสินก่อน'); return; }
    this.isSaving = true;
    
    // Send full payload to backend including scores and level
    const payload = { 
      status: this.decision, 
      notes: this.overallComment,
      total_score: this.totalScore,
      certified_level: this.decision === 'APPROVED' ? this.getCertificationLevel() : undefined,
      details: this.scoreItems.map(item => ({
        assessment_detail_id: item.assessment_detail_id,
        assessor_score: item.assessor_score,
        auditor_comment: item.auditor_comment
      }))
    };

    this.requestsService.updateRequest(this.requestId.toString(), payload).subscribe({
      next: () => { 
        this.isSaving = false; 
        alert('บันทึกผลการประเมินสำเร็จ!'); 
        this.router.navigate(['/assessor/history']); 
      },
      error: (err) => { 
        console.error('Submit error:', err);
        this.isSaving = false; 
        alert('เกิดข้อผิดพลาดในการบันทึก'); 
      }
    });
  }

  goBack() { this.router.navigate(['/assessor/assignments']); }
}
