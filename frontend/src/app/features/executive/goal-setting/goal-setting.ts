import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExecutiveService } from '../../../core/services/executive.service';
import { ToastService } from '../../../core/services/toast.service';

interface GoalItem {
  title: string;
  targetDate: string;
  targetPercent: number;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Behind' | 'Completed';
}

@Component({
  selector: 'app-goal-setting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goal-setting.html',
  styleUrl: './goal-setting.css',
})
export class GoalSetting implements OnInit {
  private executiveService = inject(ExecutiveService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  targetPercent: number | null = null;
  targetYear: number = 2030;
  isSaving = false;
  isLoading = true;

  goals: GoalItem[] = [];
  orgName = '';
  targetReductionPercent = 0;
  netZeroProgressPercent = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.executiveService.getDashboard().subscribe({
      next: (dashboard) => {
        this.orgName = dashboard.orgName;
        this.targetReductionPercent = dashboard.targetReductionPercent;
        this.netZeroProgressPercent = dashboard.netZeroProgressPercent;

        this.targetPercent = this.targetReductionPercent || 50;
        this.initializeGoals();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load executive dashboard', err);
        this.initializeGoals();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  initializeGoals() {
    const primaryGoal: GoalItem = {
      title: 'Net Zero Target (Organization-wide)',
      targetDate: `${this.targetYear}-12-31`,
      targetPercent: this.targetReductionPercent || 50,
      progress: this.netZeroProgressPercent || 0,
      status: this.netZeroProgressPercent >= 40 ? 'On Track' : 'At Risk',
    };

    this.goals = [primaryGoal];
  }

  saveGoal() {
    if (this.targetPercent === null || !this.targetYear) {
      this.toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (this.targetPercent < 1 || this.targetPercent > 100) {
      this.toast.error('เป้าหมายการลดคาร์บอนต้องอยู่ระหว่าง 1 ถึง 100 %');
      return;
    }

    this.isSaving = true;

    // Call API to set organization wide target reduction
    this.executiveService.setGoal(this.targetPercent, this.targetYear).subscribe({
      next: (res) => {
        this.toast.success('บันทึกเป้าหมายลดคาร์บอนหลักสำเร็จ');
        this.loadData();
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to save goal', err);
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย');
        this.isSaving = false;
        this.cdr.markForCheck();
      },
    });
  }

  getGoalStatusClasses(status: string): string {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-700/10';
      case 'At Risk':
        return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      case 'Behind':
        return 'bg-rose-50 text-rose-700 ring-rose-600/10';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 ring-blue-700/10';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-650/10';
    }
  }

  getProgressBarClasses(status: string): string {
    switch (status) {
      case 'On Track':
      case 'Completed':
        return 'bg-emerald-500';
      case 'At Risk':
        return 'bg-yellow-500';
      case 'Behind':
        return 'bg-rose-500';
      default:
        return 'bg-gray-500';
    }
  }
}
