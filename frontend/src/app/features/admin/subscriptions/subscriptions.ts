import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsAdminService, SubscriptionPlan, Feature } from '../../../core/services/subscriptions-admin.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.css']
})
export class AdminSubscriptionsComponent implements OnInit {
  private svc = inject(SubscriptionsAdminService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'plans' | 'features' = 'plans';
  plans: SubscriptionPlan[] = [];
  allFeatures: Feature[] = [];
  isLoading = true;
  isSaving = false;
  selectedPlan: Partial<SubscriptionPlan> | null = null;
  selectedFeature: Partial<Feature> | null = null;
  selectedFeatureIds: number[] = [];

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading = true;
    this.svc.getPlans().subscribe({
      next: (data) => { 
        this.plans = data; 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });

    this.svc.getFeatures().subscribe({
      next: (data) => {
        this.allFeatures = data;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(plan?: SubscriptionPlan) {
    this.selectedPlan = plan ? { ...plan } : {
      plan_name: '', description: '', price_per_month: 0,
      max_users: 5, max_locations: 1, is_active: true
    };
    
    // Map existing features to IDs
    this.selectedFeatureIds = plan?.features?.map(f => f.id) || [];
  }

  closeModal() { 
    this.selectedPlan = null; 
    this.selectedFeatureIds = [];
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
        this.cdr.detectChanges();
      },
      error: () => {
        alert('เกิดข้อผิดพลาด');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteFeature(id: number) {
    if (!confirm('ยืนยันการลบฟีเจอร์นี้?')) return;
    this.svc.deleteFeature(id).subscribe({
      next: () => this.loadData()
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

    // Prepare data with feature IDs
    const payload = {
      ...this.selectedPlan,
      feature_ids: this.selectedFeatureIds
    };

    const obs = this.selectedPlan.id
      ? this.svc.updatePlan(this.selectedPlan.id, payload as any)
      : this.svc.createPlan(payload as any);

    obs.subscribe({
      next: () => { 
        this.closeModal(); 
        this.loadData(); 
        this.isSaving = false; 
        this.cdr.detectChanges();
      },
      error: () => { 
        alert('เกิดข้อผิดพลาด'); 
        this.isSaving = false; 
        this.cdr.detectChanges();
      }
    });
  }

  delete(id: number) {
    if (!confirm('ยืนยันการลบแพ็กเกจนี้?')) return;
    this.svc.deletePlan(id).subscribe({ 
      next: () => this.loadData() 
    });
  }
}
