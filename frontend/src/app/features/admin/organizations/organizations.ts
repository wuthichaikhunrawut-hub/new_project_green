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
  activeTab: 'ALL' | 'EDUCATION' | 'SYSTEM' | 'OTHERS' = 'ALL';

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

  setTab(tab: 'ALL' | 'EDUCATION' | 'SYSTEM' | 'OTHERS') {
    this.activeTab = tab;
  }

  filteredOrganizations(): any[] {
    let filtered = this.organizations;

    // Filter by Tab
    if (this.activeTab === 'EDUCATION') {
      filtered = filtered.filter(o => String(o.industry_type).toLowerCase() === 'education');
    } else if (this.activeTab === 'SYSTEM') {
      filtered = filtered.filter(o => String(o.industry_type).toLowerCase() === 'system');
    } else if (this.activeTab === 'OTHERS') {
      filtered = filtered.filter(o => {
        const type = String(o.industry_type).toLowerCase();
        return type !== 'education' && type !== 'system';
      });
    }

    // Filter by Search Text
    if (!this.searchText) {
      return filtered;
    }
    const lowerSearch = this.searchText.toLowerCase();
    return filtered.filter((o: any) => 
      o.name.toLowerCase().includes(lowerSearch) ||
      (o.industry_type && o.industry_type.toLowerCase().includes(lowerSearch)) ||
      (o.tax_id && o.tax_id.toLowerCase().includes(lowerSearch))
    );
  }

  openEditModal(org?: any) {
    if (org) {
      this.selectedOrg = { ...org };
    } else {
      this.selectedOrg = {
        name: '',
        tax_id: '',
        industry_type: '',
        number_of_employees: 0,
        target_reduction_percent: 0,
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

  exportToCSV() {
    const dataToExport = this.filteredOrganizations();
    if (dataToExport.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const headers = ['Name', 'Tax ID', 'Industry', 'Employees', 'Reduction Target (%)', 'Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const org of dataToExport) {
      const row = [
        `"${org.name}"`,
        `"${org.tax_id || '-'}"`,
        `"${org.industry_type || '-'}"`,
        `"${org.number_of_employees}"`,
        `"${org.target_reduction_percent || 0}"`,
        `"${org.is_active ? 'Active' : 'Suspended'}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orgs_export_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
