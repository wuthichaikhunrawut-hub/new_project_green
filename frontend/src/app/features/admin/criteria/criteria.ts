import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GreenCriteriaService, GreenCriteria } from '../../../core/services/green-criteria.service';

interface GroupedCriteria {
  category_number: number;
  items: GreenCriteria[];
  expanded: boolean;
}

@Component({
  selector: 'app-admin-criteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './criteria.html',
  styleUrls: ['./criteria.css']
})
export class AdminCriteriaComponent implements OnInit {
  private toast = inject(ToastService);

  private criteriaService = inject(GreenCriteriaService);
  private cdr = inject(ChangeDetectorRef);

  criteriaList: GreenCriteria[] = [];
  groupedCriteria: GroupedCriteria[] = [];
  isLoading = true;
  isSaving = false;
  
  selectedCriteria: Partial<GreenCriteria> | null = null;

  ngOnInit() {
    this.loadCriteria();
  }

  loadCriteria() {
    this.isLoading = true;
    this.criteriaService.getCriteriaList().subscribe({
      next: (data) => {
        this.criteriaList = data;
        this.groupCriteria();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load criteria:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  groupCriteria() {
    const groups = new Map<number, GreenCriteria[]>();
    for (const item of this.criteriaList) {
      const cat = item.category_number || 0;
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(item);
    }
    
    this.groupedCriteria = Array.from(groups.entries())
      .map(([category_number, items]) => {
        const existingGroup = this.groupedCriteria.find(g => g.category_number === category_number);
        return {
          category_number,
          items: items.sort((a, b) => (a.criteria_code || '').localeCompare(b.criteria_code || '')),
          expanded: existingGroup ? existingGroup.expanded : false
        };
      })
      .sort((a, b) => a.category_number - b.category_number);
  }

  toggleGroup(group: GroupedCriteria) {
    group.expanded = !group.expanded;
  }

  isAnyGroupExpanded(): boolean {
    return this.groupedCriteria.some(g => g.expanded);
  }

  openModal(item?: GreenCriteria) {
    if (item) {
      this.selectedCriteria = { ...item };
    } else {
      this.selectedCriteria = {
        category_number: 1,
        criteria_code: '',
        criteria_name: '',
        max_score: 5,
        description: '',
        year_version: new Date().getFullYear()
      };
    }
  }

  closeModal() {
    this.selectedCriteria = null;
  }

  saveCriteria() {
    if (!this.selectedCriteria) return;
    this.isSaving = true;

    if (this.selectedCriteria.id) {
      this.criteriaService.updateCriteria(this.selectedCriteria.id, this.selectedCriteria).subscribe({
        next: () => {
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.closeModal();
          this.loadCriteria();
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
          this.isSaving = false;
        }
      });
    } else {
      this.criteriaService.createCriteria(this.selectedCriteria).subscribe({
        next: () => {
          this.toast.success('เพิ่มเกณฑ์การประเมินสำเร็จ');
          this.closeModal();
          this.loadCriteria();
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

  deleteCriteria(id: number) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเกณฑ์นี้? ข้อมูลการประเมินที่ผูกไว้อาจได้รับผลกระทบ')) {
      this.criteriaService.deleteCriteria(id).subscribe({
        next: () => {
          this.loadCriteria();
        },
        error: (err) => {
          console.error(err);
          this.toast.error('เกิดข้อผิดพลาดในการลบ');
        }
      });
    }
  }
}
