import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsAdminService, SubscriptionPlan, Invoice } from '../../../core/services/subscriptions-admin.service';

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

  plans: SubscriptionPlan[] = [];
  isLoading = true;
  isSaving = false;
  selectedPlan: Partial<SubscriptionPlan> | null = null;

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading = true;
    this.svc.getPlans().subscribe({
      next: (data) => { this.plans = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  openModal(plan?: SubscriptionPlan) {
    this.selectedPlan = plan ? { ...plan } : {
      plan_name: '', description: '', price_per_month: 0,
      max_users: 5, max_locations: 1, has_ai_scan: false, has_green_office: false, is_active: true
    };
  }

  closeModal() { this.selectedPlan = null; }

  save() {
    if (!this.selectedPlan) return;
    this.isSaving = true;
    const obs = this.selectedPlan.id
      ? this.svc.updatePlan(this.selectedPlan.id, this.selectedPlan)
      : this.svc.createPlan(this.selectedPlan);

    obs.subscribe({
      next: () => { this.closeModal(); this.loadData(); this.isSaving = false; },
      error: () => { alert('เกิดข้อผิดพลาด'); this.isSaving = false; }
    });
  }

  delete(id: string) {
    if (!confirm('ยืนยันการลบแพ็กเกจนี้?')) return;
    this.svc.deletePlan(id).subscribe({ next: () => this.loadData() });
  }
}
