import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgService } from '../../../core/services/org.service';
import { Organization, OrgType } from '../../../core/models/organization.model';

@Component({
  selector: 'app-admin-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizations.html'
})
export class AdminOrganizationsComponent implements OnInit {
  private toast = inject(ToastService);

  private orgService = inject(OrgService);
  private cdr = inject(ChangeDetectorRef);

  organizations: Organization[] = [];
  isLoading = true;
  searchText = '';
  activeTab: 'ALL' | OrgType | 'OTHERS' = 'ALL';

  industryTypes = [
    { value: 'GOVERNMENT', label: 'หน่วยงานภาครัฐ (Government)' },
    { value: 'STATE_ENTERPRISE', label: 'รัฐวิสาหกิจ (State Enterprise)' },
    { value: 'PRIVATE', label: 'ภาคเอกชน (Private Sector)' },
    { value: 'EDUCATION', label: 'สถาบันการศึกษา (Education)' },
    { value: 'INDUSTRIAL_OFFICE', label: 'สำนักงานในโรงงาน (Industrial Office)' },
    { value: 'LOCAL_ADMIN', label: 'องค์กรปกครองส่วนท้องถิ่น (Local Admin)' },
    { value: 'OTHERS', label: 'อื่นๆ (Others)' }
  ];

  selectedOrg: Partial<Organization> | null = null;
  isSaving = false;

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.isLoading = true;
    this.orgService.getAll().subscribe({
      next: (data: Organization[]) => {
        this.organizations = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load orgs:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: any) {
    this.activeTab = tab;
  }

  filteredOrganizations(): any[] {
    let filtered = this.organizations;

    // Filter by Tab
    if (this.activeTab !== 'ALL') {
      filtered = filtered.filter(o => {
        const type = String(o.industry_type || '').toUpperCase();
        if (this.activeTab === 'OTHERS') {
          return !this.industryTypes.some(it => it.value === type && it.value !== 'OTHERS');
        }
        return type === this.activeTab;
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

  openEditModal(org?: Organization) {
    if (org) {
      this.selectedOrg = { ...org };
    } else {
      this.selectedOrg = {
        name: '',
        tax_id: '',
        industry_type: 'PRIVATE',
        number_of_employees: 0,
        total_floor_area: 0,
        base_year: new Date().getFullYear(),
        target_reduction_percent: 0,
        current_green_status: 'NONE',
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
           this.toast.success('บันทึกข้อมูลสำเร็จ');
           this.isSaving = false;
           this.closeEditModal();
           this.loadOrganizations();
         },
         error: (err: any) => {
           console.error('Failed to update org:', err);
           this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
           this.isSaving = false;
         }
       });
    } else {
       this.orgService.create(this.selectedOrg).subscribe({
         next: () => {
           this.toast.success('สร้างองค์กรใหม่สำเร็จ');
           this.isSaving = false;
           this.closeEditModal();
           this.loadOrganizations();
         },
         error: (err: any) => {
           console.error('Failed to create org:', err);
           this.toast.error('เกิดข้อผิดพลาดในการสร้างองค์กร');
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
        this.toast.success(`${action}องค์กรเรียบร้อยแล้ว`);
        this.loadOrganizations();
      },
      error: (err: any) => {
        console.error('Failed to toggle active status:', err);
        this.toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    });
  }

  getIndustryLabel(value: string): string {
    const type = this.industryTypes.find(t => t.value === String(value).toUpperCase());
    return type ? type.label.split(' (')[0] : (value || 'ไม่ระบุ');
  }

  exportToCSV() {
    const dataToExport = this.filteredOrganizations();
    if (dataToExport.length === 0) {
      this.toast.warning('ไม่มีข้อมูลให้ส่งออก');
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

  getStatusBadgeClass(active: boolean): string {
    return 'status-badge ' + (active ? 'status-approved' : 'status-rejected');
  }

  getStatusLabel(active: boolean): string {
    return active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน';
  }
}
