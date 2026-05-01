import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';

@Component({
  selector: 'app-assessor-evidence-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './evidence-review.html',
  styles: ``
})
export class AssessorEvidenceReviewComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  requestId: number = 0;
  requestName = '';
  evidenceItems: any[] = [];
  isLoading = true;

  get passedCount() { return this.evidenceItems.filter(i => i.result === 'PASS').length; }
  get failedCount() { return this.evidenceItems.filter(i => i.result === 'FAIL').length; }
  get pendingCount() { return this.evidenceItems.filter(i => !i.result).length; }



  ngOnInit() {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest();
  }

  loadRequest() {
    this.requestsService.getRequestById(this.requestId.toString()).subscribe({
      next: (req) => {
        this.requestName = req.organization?.name || 'ไม่พบข้อมูลองค์กร';
        this.evidenceItems = (req.details || []).map((d: any) => ({
          ...d,
          criteria_code: d.criteria?.criteria_code,
          criteria_name: d.criteria?.criteria_name,
          evidence_files: d.evidence_files || [],
          comment: d.auditor_comment || '',
          result: null
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  setResult(item: any, result: 'PASS' | 'FAIL') {
    item.result = result;
  }

  saveEvidence() {
    alert('บันทึกผลการตรวจหลักฐานแล้ว (Mock)');
  }

  goBack() {
    this.router.navigate(['/assessor/assignments']);
  }
}
