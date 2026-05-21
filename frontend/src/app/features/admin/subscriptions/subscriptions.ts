import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SubscriptionsAdminService, SubscriptionPlan, Feature } from '../../../core/services/subscriptions-admin.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.css']
})
export class AdminSubscriptionsComponent implements OnInit {
  private toast = inject(ToastService);

  private svc = inject(SubscriptionsAdminService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'plans' | 'features' | 'permissions' = 'plans';
  plans: SubscriptionPlan[] = [];
  allFeatures: Feature[] = [];
  isLoading = true;
  isSaving = false;

  // Permissions state
  roles = [
    'System Admin',
    'Organization Admin',
    'Executive',
    'User',
    'Assessor'
  ];

  permissionSettings: Record<string, string> = {};
  
  permissionGroups = [
    {
      category: 'จัดการข้อกำหนดโควตา',
      items: [
        { key: 'permission.manage_quota', label: 'จำกัดจำนวนผู้ใช้งาน' }
      ]
    },
    {
      category: 'จัดการสิทธิ์การเข้าถึงฟีเจอร์',
      items: [
        { key: 'permission.ai_scan', label: 'เปิด/ปิด AI Scan' },
        { key: 'permission.green_office', label: 'เปิด/ปิด Green Office Module' }
      ]
    }
  ];

  selectedPlan: Partial<SubscriptionPlan> | null = null;
  selectedFeature: Partial<Feature> | null = null;
  selectedFeatureIds: number[] = [];
  selectedPlanQuotas: Record<string, number> = {}; // { feature_code: quota }

  private platformId = inject(PLATFORM_ID);

  ngOnInit() { 
    if (isPlatformBrowser(this.platformId)) {
      // Use setTimeout to ensure initial load happens after component is fully ready
      setTimeout(() => {
        this.loadData(); 
      }, 0);
    }
  }

  getPlanUsageCount(featureId: number): number {
    return this.plans.filter(p => p.features?.some(f => f.id === featureId)).length;
  }

  loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Use forkJoin to load all required data in parallel and stop loading only when all are done
    forkJoin({
      plans: this.svc.getPlans(),
      features: this.svc.getFeatures(),
      permissions: this.settingsService.getSettings()
    }).subscribe({
      next: (result) => {
        this.plans = result.plans;
        this.allFeatures = result.features;
        this.permissionSettings = result.permissions;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load subscription data:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getQuotaKey(planId: number | undefined, featCode: string): string {
    const code = featCode || '';
    return `quota.plan:${planId}.feat:${code.toLowerCase()}`;
  }

  getQuota(featCode: string): number {
    const code = featCode || '';
    return this.selectedPlanQuotas[code] || 0;
  }

  setQuota(featCode: string, value: number) {
    const code = featCode || '';
    this.selectedPlanQuotas[code] = value;
  }

  getPlanFeatureQuota(planId: number, featCode: string): string {
    const key = this.getQuotaKey(planId, featCode);
    const val = this.permissionSettings[key];
    return val ? `${val} ครั้ง/เดือน` : 'ไม่จำกัด';
  }

  hasPermission(featureCode: string, role: string): boolean {
    const code = featureCode || '';
    const settingKey = `permission.${code.toLowerCase()}`;
    const value = this.permissionSettings[settingKey];
    if (!value) return false;
    
    try {
      if (value.startsWith('[') || value.startsWith('{')) {
        const roles = JSON.parse(value);
        return Array.isArray(roles) ? roles.includes(role) : roles === role;
      }
      return value === role;
    } catch {
      return value === role;
    }
  }

  togglePermission(featureCode: string, role: string) {
    const code = featureCode || '';
    const settingKey = `permission.${code.toLowerCase()}`;
    let currentVal = this.permissionSettings[settingKey] || '[]';
    let roles: string[] = [];

    try {
      if (currentVal.startsWith('[') || currentVal.startsWith('{')) {
        roles = JSON.parse(currentVal);
        if (!Array.isArray(roles)) roles = [currentVal];
      } else {
        roles = [currentVal];
      }
    } catch {
      roles = currentVal ? [currentVal] : [];
    }

    const index = roles.indexOf(role);
    if (index > -1) {
      roles.splice(index, 1);
    } else {
      roles.push(role);
    }

    this.permissionSettings[settingKey] = JSON.stringify(roles);
  }

  savePermissions() {
    this.isSaving = true;
    this.settingsService.updateSettings(this.permissionSettings).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('บันทึกการตั้งค่าสิทธิ์เรียบร้อยแล้ว');
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกสิทธิ์');
        this.cdr.markForCheck();
      }
    });
  }

  openModal(plan?: SubscriptionPlan) {
    this.selectedPlan = plan ? { ...plan } : {
      plan_name: '', description: '', price_per_month: 0,
      max_users: 5, max_locations: 1, is_active: true
    };
    this.selectedFeatureIds = plan?.features?.map(f => f.id) || [];
    
    // Load quotas for this plan
    this.selectedPlanQuotas = {};
    if (plan?.id) {
      plan.features?.forEach(f => {
        const key = this.getQuotaKey(plan.id, f.feature_code);
        const val = this.permissionSettings[key];
        this.selectedPlanQuotas[f.feature_code] = val ? Number(val) : 0;
      });
    }
  }

  closeModal() { 
    this.selectedPlan = null; 
    this.selectedFeatureIds = [];
    this.selectedPlanQuotas = {};
  }

  openFeatureModal(feature?: Feature) {
    this.selectedFeature = feature ? { ...feature } : {
      feature_code: '', feature_name: '', description: ''
    };
  }

  closeFeatureModal() {
    this.selectedFeature = null;
  }

  saveFeature() {
    if (!this.selectedFeature) return;
    this.isSaving = true;
    const obs = this.selectedFeature.id
      ? this.svc.updateFeature(this.selectedFeature.id, this.selectedFeature)
      : this.svc.createFeature(this.selectedFeature);

    obs.subscribe({
      next: () => {
        this.closeFeatureModal();
        this.loadData();
        this.isSaving = false;
        this.toast.success('บันทึกฟีเจอร์สำเร็จ');
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('ไม่สามารถบันทึกฟีเจอร์ได้');
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteFeature(id: number) {
    if (!confirm('ยืนยันการลบฟีเจอร์?')) return;
    this.svc.deleteFeature(id).subscribe({
      next: () => {
        this.toast.success('ลบฟีเจอร์สำเร็จ');
        this.loadData();
      }
    });
  }

  toggleFeature(featureId: number) {
    const index = this.selectedFeatureIds.indexOf(featureId);
    if (index > -1) {
      this.selectedFeatureIds.splice(index, 1);
    } else {
      this.selectedFeatureIds.push(featureId);
    }
  }

  isFeatureSelected(featureId: number): boolean {
    return this.selectedFeatureIds.includes(featureId);
  }

  save() {
    if (!this.selectedPlan) return;
    this.isSaving = true;

    const payload = {
      ...this.selectedPlan,
      feature_ids: this.selectedFeatureIds
    };

    const obs = this.selectedPlan.id
      ? this.svc.updatePlan(this.selectedPlan.id, payload as any)
      : this.svc.createPlan(payload as any);

    obs.subscribe({
      next: (res: any) => { 
        // Save quotas
        if (res.id) {
          const quotaPayload: Record<string, any> = {};
          this.allFeatures.forEach(f => {
            if (this.isFeatureSelected(f.id)) {
              const key = this.getQuotaKey(res.id, f.feature_code);
              quotaPayload[key] = this.selectedPlanQuotas[f.feature_code] || 0;
            }
          });
          this.settingsService.updateSettings(quotaPayload).subscribe();
        }

        this.closeModal(); 
        this.loadData(); 
        this.isSaving = false; 
        this.toast.success('บันทึกแพ็กเกจสำเร็จ');
        this.cdr.markForCheck();
      },
      error: () => { 
        this.toast.error('ไม่สามารถบันทึกแพ็กเกจได้');
        this.isSaving = false; 
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: number) {
    if (!confirm('ยืนยันการลบแพ็กเกจ?')) return;
    this.svc.deletePlan(id).subscribe({ 
      next: () => {
        this.toast.success('ลบแพ็กเกจสำเร็จ');
        this.loadData();
      }
    });
  }
}
