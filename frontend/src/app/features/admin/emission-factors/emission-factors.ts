import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef, Renderer2, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { EmissionFactorsService, EmissionFactor } from '../../../core/services/emission-factors.service';

@Component({
  selector: 'app-admin-emission-factors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emission-factors.html',
  styleUrls: ['./emission-factors.css']
})
export class AdminEmissionFactorsComponent implements OnInit, AfterViewInit, OnDestroy {
  private toast = inject(ToastService);

  private factorsService = inject(EmissionFactorsService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  @ViewChild('modalRef') modalRef!: ElementRef;
  @ViewChild('deleteModalRef') deleteModalRef!: ElementRef;

  factors: EmissionFactor[] = [];
  isLoading = true;
  isSaving = false;
  userRole = '';

  selectedFactor: Partial<EmissionFactor> | null = null;
  factorToDelete: string | null = null;
  searchText = '';
  activeTab: 'ALL' | 1 | 2 | 3 = 'ALL';

  get isSystemAdmin(): boolean {
    const role = String(this.userRole || '').trim().toUpperCase().replace(/[\s_]/g, '');
    return role === 'SYSTEMADMIN' || role === 'ADMIN';
  }

  scopes = [1, 2, 3];

  ngOnInit() {
    const user = this.authService.getUser();
    this.userRole = user?.role || '';
    this.loadFactors();
  }

  ngAfterViewInit() {
    // ย้าย Modal ออกไปนอกสุดที่ระดับ body
    if (this.modalRef) {
      this.renderer.appendChild(document.body, this.modalRef.nativeElement);
    }
    if (this.deleteModalRef) {
      this.renderer.appendChild(document.body, this.deleteModalRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.modalRef) {
      try {
        this.renderer.removeChild(document.body, this.modalRef.nativeElement);
      } catch (e) {}
    }
    if (this.deleteModalRef) {
      try {
        this.renderer.removeChild(document.body, this.deleteModalRef.nativeElement);
      } catch (e) {}
    }
  }

  loadFactors() {
    this.isLoading = true;
    this.factorsService.getFactors().subscribe({
      next: (data) => {
        this.factors = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load emission factors:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: 'ALL' | 1 | 2 | 3) {
    this.activeTab = tab;
  }

  filteredFactors(): EmissionFactor[] {
    let filtered = this.factors;

    // Filter by Tab
    if (this.activeTab !== 'ALL') {
      filtered = filtered.filter(f => f.scope === Number(this.activeTab));
    }

    // Filter by Search Text
    if (!this.searchText) {
      return filtered;
    }
    const lowerSearch = this.searchText.toLowerCase();
    return filtered.filter(f => 
      f.name.toLowerCase().includes(lowerSearch) ||
      (f.source && f.source.toLowerCase().includes(lowerSearch))
    );
  }

  openModal(item?: EmissionFactor) {
    if (item) {
      this.selectedFactor = { ...item };
    } else {
      this.selectedFactor = {
        scope: 1,
        name: '',
        unit: 'kWh',
        factor_value: 0.0,
        source: 'TGO',
        year: 2569
      };
    }
  }

  closeModal() {
    this.selectedFactor = null;
  }

  saveFactor() {
    if (!this.selectedFactor) return;
    this.isSaving = true;

    if (!this.isSystemAdmin) {
      // ✅ Assessor Admin / Assessor -> Send Proposal Request instead of direct write
      const originalValue = this.selectedFactor.id 
        ? String(this.factors.find(f => f.id === this.selectedFactor?.id)?.factor_value || 0)
        : '0';

      const isNew = !this.selectedFactor.id;
      const proposePayload = {
        targetType: 'EMISSION_FACTOR',
        targetId: this.selectedFactor.id || 0,
        name: this.selectedFactor.name || 'เพิ่มปัจจัยการปล่อยก๊าซใหม่',
        oldValue: originalValue,
        newValue: String(this.selectedFactor.factor_value || 0),
        reason: isNew
          ? 'เสนอเพิ่มค่าสัมประสิทธิ์ตัวคูณคาร์บอนฟุตพริ้นท์ใหม่ เพื่อเพิ่มขีดความสามารถการคำนวณการใช้ทรัพยากร'
          : 'เสนอแก้ไขปรับปรุงตัวคูณคาร์บอนฟุตพริ้นท์เดิม',
        details: isNew ? {
          scope: Number(this.selectedFactor.scope || 1),
          unit: this.selectedFactor.unit || 'kWh',
          source: this.selectedFactor.source || 'TGO',
          year: Number(this.selectedFactor.year || new Date().getFullYear())
        } : null
      };

      this.http.post('http://localhost:3001/notifications/propose-academic', proposePayload).subscribe({
        next: () => {
          this.toast.success('ยื่นข้อเสนอแก้ไขสูตรคาร์บอนต่อ System Admin เรียบร้อยแล้วครับ');
          this.closeModal();
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการยื่นส่งคำขออนุมัติ');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
      return;
    }

    if (this.selectedFactor.id) {
      this.factorsService.updateFactor(this.selectedFactor.id, this.selectedFactor).subscribe({
        next: () => {
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.closeModal();
          this.loadFactors();
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          this.isSaving = false;
        }
      });
    } else {
      this.factorsService.createFactor(this.selectedFactor).subscribe({
        next: () => {
          this.toast.success('เพิ่มค่าสัมประสิทธิ์สำเร็จ');
          this.closeModal();
          this.loadFactors();
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
          this.isSaving = false;
        }
      });
    }
  }

  deleteFactor(id: string) {
    this.factorToDelete = id;
  }

  confirmDelete() {
    if (!this.factorToDelete) return;
    this.factorsService.deleteFactor(this.factorToDelete).subscribe({
      next: () => {
        this.toast.success('ลบรายการสำเร็จ');
        this.factorToDelete = null;
        this.loadFactors();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('เกิดข้อผิดพลาดในการลบ');
      }
    });
  }
}
