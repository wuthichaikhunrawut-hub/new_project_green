import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessorsAdminService, AssessorUser } from '../../../core/services/assessors-admin.service';

@Component({
  selector: 'app-admin-assessors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assessors.html',
  styleUrls: ['./assessors.css']
})
export class AdminAssessorsComponent implements OnInit {
  private svc = inject(AssessorsAdminService);
  private cdr = inject(ChangeDetectorRef);

  assessors: AssessorUser[] = [];
  isLoading = true;
  searchText = '';

  ngOnInit() { this.loadAssessors(); }

  loadAssessors() {
    this.isLoading = true;
    this.svc.getAssessors().subscribe({
      next: (data) => { this.assessors = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  filteredAssessors(): AssessorUser[] {
    if (!this.searchText) {
      return this.assessors;
    }
    const lowerSearch = this.searchText.toLowerCase();
    return this.assessors.filter(a => 
      a.username.toLowerCase().includes(lowerSearch) ||
      a.email.toLowerCase().includes(lowerSearch)
    );
  }

  verify(user: AssessorUser) {
    const action = user.assessor_verified ? 'เพิกถอนการอนุมัติ' : 'อนุมัติ';
    if (!confirm(`ต้องการ${action}สถานะผู้ตรวจประเมิน ${user.username} หรือไม่?`)) return;
    this.svc.verifyAssessor(user.id, !user.assessor_verified).subscribe({ next: () => this.loadAssessors() });
  }

  suspend(user: AssessorUser) {
    const action = user.is_active ? 'ระงับการใช้งาน' : 'เปิดใช้งาน';
    if (!confirm(`ต้องการ${action}บัญชีผู้ตรวจประเมิน ${user.username} หรือไม่?`)) return;
    
    this.svc.suspendAssessor(user.id, !user.is_active).subscribe({
      next: () => {
        alert(`${action} บัญชี ${user.username} เรียบร้อยแล้ว`);
        this.loadAssessors();
      },
      error: () => {
        alert(`เกิดข้อผิดพลาด ไม่สามารถ${action}ได้`);
      }
    });
  }
}
