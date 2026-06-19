import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExecutiveService } from '../../../core/services/executive.service';
import { ToastService } from '../../../core/services/toast.service';

interface GoalItem {
  id?: number;
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

  title = '';
  targetDate = '';
  targetPercent: number | null = null;
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

        this.executiveService.getCustomGoals().subscribe({
          next: (customGoals) => {
            this.initializeGoals(customGoals);
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to load custom goals from backend', err);
            this.initializeGoals();
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load executive dashboard', err);
        this.initializeGoals();
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  initializeGoals(backendGoals?: GoalItem[]) {
    // 1. Primary Net Zero goal from database / dashboard
    const primaryGoal: GoalItem = {
      title: 'Net Zero Target (Organization-wide)',
      targetDate: '2030-12-31',
      targetPercent: this.targetReductionPercent || 50,
      progress: this.netZeroProgressPercent || 0,
      status: this.netZeroProgressPercent >= 40 ? 'On Track' : 'At Risk'
    };

    let customGoals: GoalItem[] = backendGoals || [];

    // Fallback mock goals if no custom goals saved yet
    if (customGoals.length === 0) {
      customGoals = [
        {
          title: 'Reduce Energy Consumption HQ',
          targetDate: '2027-06-30',
          targetPercent: 25,
          progress: 12,
          status: 'At Risk'
        },
        {
          title: 'Paperless Office Campaign',
          targetDate: '2026-12-31',
          targetPercent: 80,
          progress: 65,
          status: 'On Track'
        }
      ];
    }

    this.goals = [primaryGoal, ...customGoals];
  }

  saveGoal() {
    if (!this.title || !this.targetDate || this.targetPercent === null) {
      this.toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (this.targetPercent < 1 || this.targetPercent > 100) {
      this.toast.error('เป้าหมายการลดคาร์บอนต้องอยู่ระหว่าง 1 ถึง 100 %');
      return;
    }

    this.isSaving = true;
    const targetYear = new Date(this.targetDate).getFullYear();

    // Call API to set organization wide target reduction
    this.executiveService.setGoal(this.targetPercent, targetYear).subscribe({
      next: (res) => {
        // Add new goal to list
        const newGoal: GoalItem = {
          title: this.title,
          targetDate: this.targetDate,
          targetPercent: this.targetPercent!,
          progress: 0, // start at 0% progress
          status: 'On Track'
        };

        const customGoals = this.goals.slice(1); // omit the primary database goal
        customGoals.unshift(newGoal);

        // Save custom goals to backend
        this.executiveService.saveCustomGoals(customGoals).subscribe({
          next: () => {
            this.toast.success('บันทึกเป้าหมายลดคาร์บอนสำเร็จ');
            // Reload data to recalculate database targets
            this.loadData();
            
            // Reset form
            this.title = '';
            this.targetDate = '';
            this.targetPercent = null;
            this.isSaving = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to save custom goals to backend', err);
            this.toast.error('เกิดข้อผิดพลาดในการบันทึกเป้าหมายย่อย');
            this.isSaving = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Failed to save goal', err);
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย');
        this.isSaving = false;
        this.cdr.markForCheck();
      }
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
