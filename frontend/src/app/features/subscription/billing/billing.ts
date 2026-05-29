import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { BillingService, PaymentMethod } from '../../../core/services/billing.service';
import { SettingsService } from '../../../core/services/settings.service';
import { UserSubscriptionsService } from '../../../core/services/user-subscriptions.service';
import { SubscriptionPlan } from '../../../core/services/subscriptions-admin.service';
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripePaymentElement,
} from '@stripe/stripe-js';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './billing.html',
  styleUrl: './billing.css'
})
export class BillingComponent implements OnInit {
  private toast = inject(ToastService);

  private billingService = inject(BillingService);
  private settingsService = inject(SettingsService);
  private userSubService = inject(UserSubscriptionsService);
  private router = inject(Router);
  private location = inject(Location);

  @ViewChild('paymentElement') paymentElementRef!: ElementRef;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  paymentElement: StripePaymentElement | null = null;

  paymentMethods: PaymentMethod[] = [];
  isLoading = true;
  isStripeLoading = true;
  isSaving = false;
  errorMessage = '';
  
  showDeleteConfirm = false;
  methodToDelete: string | null = null;
  
  selectedPlan: SubscriptionPlan | null = null;
  billingCycle = 'monthly';
  nextBillingDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  async ngOnInit() {
    const state = window.history.state;
    if (state && state.selectedPlan) {
      this.selectedPlan = state.selectedPlan;
      this.billingCycle = state.billingCycle || 'monthly';
      this.setupPaymentFlow();
    } else {
      // Auto-fetch current subscription if no state was passed (e.g. direct page refresh)
      this.userSubService.getMySubscription().subscribe({
        next: (sub) => {
          if (sub && sub.plan) {
            this.selectedPlan = sub.plan;
            this.billingCycle = 'monthly'; // Defaulting to monthly if not specified
          }
          this.setupPaymentFlow();
        },
        error: (err) => {
          console.error('Auto-fetch plan error:', err);
          this.setupPaymentFlow();
        }
      });
    }

    this.loadPaymentMethods();
  }

  async setupPaymentFlow() {
    const price = this.selectedPlan?.price_per_month;
    if (this.selectedPlan && (!price || price <= 0)) {
      this.isStripeLoading = false;
      this.isLoading = false;
      return;
    }
    await this.initStripe();
  }

  async initStripe() {
    this.settingsService.getSettings().subscribe({
      next: async (settings) => {
        const publicKey = settings['stripe.public_key'];
        if (!publicKey) {
          this.isStripeLoading = false;
          return;
        }

        this.stripe = await loadStripe(publicKey);
        if (!this.stripe) {
          this.isStripeLoading = false;
          return;
        }

        this.billingService.createSetupIntent().subscribe({
          next: async (res) => {
            if (!res.clientSecret) {
              this.errorMessage = 'ระบบไม่ได้รับรหัสความปลอดภัยจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
              this.isStripeLoading = false;
              return;
            }

            // Apply Premium Theme to Stripe Element
            this.elements = this.stripe!.elements({
              clientSecret: res.clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#10b981',
                  colorBackground: '#ffffff',
                  colorText: '#1e293b',
                  colorDanger: '#ef4444',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '12px',
                },
                rules: {
                  '.Input': {
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                  },
                  '.Input:focus': {
                    border: '1px solid #10b981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)',
                  },
                  '.Label': {
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#475569',
                  }
                }
              }
            });

            this.paymentElement = this.elements.create('payment', {
              layout: 'tabs'
            });
            
            this.paymentElement.mount(this.paymentElementRef.nativeElement);
            
            this.paymentElement.on('ready', () => {
              this.isStripeLoading = false;
              // Force a resize event to ensure Stripe recalculates height
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
              }, 100);
            });

            this.paymentElement.on('loaderror', (event: { error?: { message?: string } }) => {
              this.isStripeLoading = false;
              this.errorMessage = 'ไม่สามารถโหลดฟอร์มชำระเงินได้ เนื่องจากปัญหาการเชื่อมต่อ กรุณารีเฟรชหน้าจอหรือตรวจสอบอินเทอร์เน็ตของคุณ';
            });

            (
              this.paymentElement as unknown as {
                on(
                  eventType: 'change',
                  handler: (event: { error?: { message?: string } }) => void,
                ): void;
              }
            ).on('change', (event) => {
              this.errorMessage = event.error?.message ?? '';
            });
          },
          error: (err) => {
            this.isStripeLoading = false;
            this.errorMessage = 'ไม่สามารถเชื่อมต่อกับระบบชำระเงินได้ในขณะนี้';
          }
        });
      },
      error: (err) => {
        this.isStripeLoading = false;
      }
    });
  }

  loadPaymentMethods() {
    this.isLoading = true;
    this.billingService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  async handleSubmit() {
    const price = this.selectedPlan?.price_per_month;
    if (this.selectedPlan && (!price || price <= 0)) {
      this.isSaving = true;
      this.errorMessage = '';
      this.userSubService.subscribeToPlan(this.selectedPlan.id).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.toast.success('เปิดใช้งานแพ็กเกจฟรีเรียบร้อยแล้ว!');
          this.router.navigate(['/subscription']);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.message || 'เกิดข้อผิดพลาดในการเปิดใช้งานแพ็กเกจฟรี';
          this.toast.error(this.errorMessage);
        }
      });
      return;
    }

    if (!this.stripe || !this.elements) return;

    this.isSaving = true;
    this.errorMessage = '';

    const { error } = await this.stripe.confirmSetup({
      elements: this.elements,
      confirmParams: {
        return_url: window.location.origin + '/subscription/billing',
      },
      redirect: 'if_required'
    });

    if (error) {
      this.errorMessage = error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      this.isSaving = false;
    } else {
      // Success - reload methods
      this.loadPaymentMethods();
      this.isSaving = false;
      this.toast.success('บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว');
      // Re-init payment element to clear it
      await this.initStripe();
    }
  }

  deleteMethod(id: string) {
    this.methodToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.methodToDelete) {
      this.billingService.deletePaymentMethod(this.methodToDelete).subscribe(() => {
        this.loadPaymentMethods();
        this.cancelDelete();
      });
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.methodToDelete = null;
  }

  goBack() {
    this.location.back();
  }
}
