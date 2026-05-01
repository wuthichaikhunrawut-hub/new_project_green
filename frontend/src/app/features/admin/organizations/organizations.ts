import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgService } from '../../../core/services/org.service';

@Component({
  selector: 'app-admin-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizations.html'
})
export class AdminOrganizationsComponent implements OnInit {
  private orgService = inject(OrgService);
  private cdr = inject(ChangeDetectorRef);

  organizations: any[] = [];
  isLoading = true;
  searchText = '';

  selectedOrg: any | null = null;
  isSaving = false;

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.isLoading = true;
    this.orgService.getAll().subscribe({
      next: (data: any) => {
        this.organizations = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load orgs:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filteredOrganizations(): any[] {
    if (!this.searchText) {
      return this.organizations;
    }
    const lowerSearch = this.searchText.toLowerCase();
    return this.organizations.filter((o: any) => 
      o.name.toLowerCase().includes(lowerSearch) ||
      (o.business_type && o.business_type.toLowerCase().includes(lowerSearch))
    );
  }

  openEditModal(org?: any) {
    if (org) {
      this.selectedOrg = { ...org };
    } else {
      this.selectedOrg = {
        name: '',
        business_type: '',
        is_active: true
      };
    }
  }

  closeEditModal() {
    this.selectedOrg = null;
  }

  saveOrganization() {
    if (!this.selectedOrg) return;
    this.isSaving = true;

    if (this.selectedOrg.id) {
       this.orgService.updateOrganization(this.selectedOrg.id, this.selectedOrg).subscribe({
         next: () => {
           alert('บันทึกข้อมูลสำเร็จ');
           this.isSaving = false;
           this.closeEditModal();
           this.loadOrganizations();
         },
         error: (err: any) => {
           console.error('Failed to update org:', err);
           alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
           this.isSaving = false;
         }
       });
    } else {
       this.orgService.create(this.selectedOrg).subscribe({
         next: () => {
           alert('สร้างองค์กรใหม่สำเร็จ');
           this.isSaving = false;
           this.closeEditModal();
           this.loadOrganizations();
         },
         error: (err: any) => {
           console.error('Failed to create org:', err);
           alert('เกิดข้อผิดพลาดในการสร้างองค์กร');
           this.isSaving = false;
         }
       });
    }
  }

  suspendOrganization(org: any) {
    const action = org.is_active ? 'ระงับ' : 'เปิดใช้งาน';
    if (!confirm(`ยืนยันการ${action}องค์กรนี้ใช่หรือไม่?`)) return;
    
    this.orgService.updateOrganization(org.id, { is_active: !org.is_active }).subscribe({
      next: () => {
        alert(`${action}องค์กรเรียบร้อยแล้ว`);
        this.loadOrganizations();
      },
      error: (err: any) => {
        console.error('Failed to toggle active status:', err);
        alert('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    });
  }
}
