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
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // Safety Timeout: Force stop loading after 5 seconds
    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    }, 5000);

    forkJoin({
      plans: this.userSubService.getPlans(),
      settings: this.settingsService.getSettings()
    }).subscribe({
      next: (res) => {
        this.plans = res.plans || [];
        this.permissionSettings = res.settings || {};
        
        // Load my subscription right after plans
        this.userSubService.getMySubscription().subscribe({
          next: (sub) => {
            if (sub && sub.plan) {
              this.currentPlan = sub.plan;
            }
            this.isLoading = false;
            this.cdr.markForCheck(); // Force UI update!
          },
          error: (err) => {
            console.error('MySub error:', err);
            this.isLoading = false;
            this.cdr.markForCheck();
          }
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
}
