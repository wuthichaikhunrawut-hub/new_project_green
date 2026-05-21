import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmissionFactorsService, EmissionFactor } from '../../../core/services/emission-factors.service';

@Component({
  selector: 'app-admin-emission-factors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emission-factors.html',
  styleUrls: ['./emission-factors.css']
})
export class AdminEmissionFactorsComponent implements OnInit {
  private toast = inject(ToastService);

  private factorsService = inject(EmissionFactorsService);
  private cdr = inject(ChangeDetectorRef);

  factors: EmissionFactor[] = [];
  isLoading = true;
  isSaving = false;
  
  selectedFactor: Partial<EmissionFactor> | null = null;
  searchText = '';
  activeTab: 'ALL' | 1 | 2 | 3 = 'ALL';

  scopes = [1, 2, 3];

  ngOnInit() {
    this.loadFactors();
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
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้? ถ้ายังใช้งานอยู่ให้ปรับสถานะเป็น "ระงับ" แทนการลบเพื่อป้องกันข้อมูลเก่าผิดพลาด')) {
      this.factorsService.deleteFactor(id).subscribe({
        next: () => {
          this.loadFactors();
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการลบ');
        }
      });
    }
  }
}
