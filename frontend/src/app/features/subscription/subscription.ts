import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserSubscriptionsService } from '../../core/services/user-subscriptions.service';
import { SettingsService } from '../../core/services/settings.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css'
})
export class SubscriptionComponent implements OnInit {
  private userSubService = inject(UserSubscriptionsService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentPlan: any = null;
  billingCycle = 'monthly'; // 'monthly' | 'yearly'
  plans: any[] = [];
  permissionSettings: Record<string, string> = {};
  quotaSummary: Record<string, { feature_name: string; used: number; limit: number; allowed: boolean }> = {};
  payments: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    forkJoin({
      plans: this.userSubService.getPlans(),
      settings: this.settingsService.getSettings()
    }).subscribe({
      next: (res) => {
        this.plans = res.plans || [];
        this.permissionSettings = res.settings || {};

        forkJoin({
          subscription: this.userSubService.getMySubscription(),
          usage: this.userSubService.getMyUsage(),
          payments: this.userSubService.getMyPayments(),
        }).subscribe({
          next: (data) => {
            if (data.subscription && data.subscription.plan) {
              this.currentPlan = data.subscription.plan;
            }
            this.quotaSummary = (data.usage || []).reduce(
              (acc: any, item: any) => ({
                ...acc,
                [item.feature_code]: item,
              }),
              {},
            );
            this.payments = data.payments || [];
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Subscription loading failed:', err);
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: (err) => {
        console.error('Data load error:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getPlanFeatureQuota(planId: number, featCode: string): string {
    if (!featCode) return '';
    const key = `quota.plan:${planId}.feat:${featCode.toLowerCase()}`;
    const val = this.permissionSettings[key];
    if (val && val !== '0') {
      return `(${val} ครั้ง/เดือน)`;
    }
    return '(ไม่จำกัด)';
  }

  getFeatureUsageText(featureCode: string): string {
    if (!featureCode) return '';
    const key = featureCode.toUpperCase();
    const quota = this.quotaSummary[key];
    if (!quota) return '';
    if (quota.limit === 0) {
      return `ใช้ไป ${quota.used} ครั้ง (ไม่จำกัด)`;
    }
    return `ใช้ไป ${quota.used}/${quota.limit} ครั้ง`;
  }

  getCurrentQuotaSummary(): string {
    const quota = this.quotaSummary['AI_SCAN'] || this.quotaSummary['ai_scan'];
    if (!quota) {
      return '';
    }
    if (quota.limit === 0) {
      return `AI Scan เดือนนี้: ใช้งาน ${quota.used} ครั้ง (ไม่จำกัด)`;
    }
    return `AI Scan เดือนนี้: ${quota.used}/${quota.limit} ครั้ง`;
  }

  toggleBillingCycle() {
    this.billingCycle = this.billingCycle === 'monthly' ? 'yearly' : 'monthly';
  }

  selectPlan(plan: any) {
    if (this.currentPlan?.id === plan.id) {
      return;
    }
    
    // Navigate to billing with plan info
    this.router.navigate(['/subscription/billing'], { 
      state: { 
        selectedPlan: plan,
        billingCycle: this.billingCycle
      } 
    });
  }

  cancelSubscription() {
    if (confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกแพ็กเกจปัจจุบัน? คุณจะสูญเสียสิทธิ์การใช้งานพรีเมียมทันที')) {
      this.isLoading = true;
      this.userSubService.cancelSubscription().subscribe({
        next: () => {
          alert('ยกเลิกแพ็กเกจเรียบร้อยแล้ว');
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          alert('เกิดข้อผิดพลาดในการยกเลิกแพ็กเกจ');
          this.cdr.markForCheck();
        }
      });
    }
  }
}
