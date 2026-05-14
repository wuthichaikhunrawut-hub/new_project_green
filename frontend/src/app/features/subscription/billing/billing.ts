import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { BillingService } from '../../../core/services/billing.service';
import { SettingsService } from '../../../core/services/settings.service';
import { UserSubscriptionsService } from '../../../core/services/user-subscriptions.service';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './billing.html',
  styleUrl: './billing.css'
})
export class BillingComponent implements OnInit {
  private billingService = inject(BillingService);
  private settingsService = inject(SettingsService);
  private userSubService = inject(UserSubscriptionsService);
  private router = inject(Router);
  private location = inject(Location);

  @ViewChild('paymentElement') paymentElementRef!: ElementRef;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  paymentElement: any = null;

  paymentMethods: any[] = [];
  isLoading = true;
  isStripeLoading = true;
  isSaving = false;
  errorMessage = '';
  
  selectedPlan: any = null;
  billingCycle = 'monthly';
  nextBillingDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  async ngOnInit() {
    const state = window.history.state;
    if (state && state.selectedPlan) {
      this.selectedPlan = state.selectedPlan;
      this.billingCycle = state.billingCycle || 'monthly';
    } else {
      // Auto-fetch current subscription if no state was passed (e.g. direct page refresh)
      this.userSubService.getMySubscription().subscribe({
        next: (sub) => {
          if (sub && sub.plan) {
            this.selectedPlan = sub.plan;
            this.billingCycle = 'monthly'; // Defaulting to monthly if not specified
          }
        },
        error: (err) => console.error('Auto-fetch plan error:', err)
      });
    }

    this.loadPaymentMethods();
    await this.initStripe();
  }

  async initStripe() {
    console.log('Initializing Stripe...');
    this.settingsService.getSettings().subscribe({
      next: async (settings) => {
        const publicKey = settings['stripe.public_key'];
        if (!publicKey) {
          console.error('Stripe Public Key not found');
          this.isStripeLoading = false;
          return;
        }

        console.log('Loading Stripe with key:', publicKey.substring(0, 8) + '...');
        this.stripe = await loadStripe(publicKey);
        if (!this.stripe) {
          console.error('Failed to load Stripe SDK');
          this.isStripeLoading = false;
          return;
        }

        // Aggressive fallback: Force show after 5 seconds if Stripe is slow
        setTimeout(() => {
          if (this.isStripeLoading) {
            console.warn('Stripe load too slow, forcing UI to show...');
            this.isStripeLoading = false;
            // Force another resize event just in case
            setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
          }
        }, 5000);

        console.log('Creating SetupIntent...');
        this.billingService.createSetupIntent().subscribe({
          next: async (res) => {
            console.log('SetupIntent received, initializing elements...');
            if (!res.clientSecret) {
              console.error('No client secret received!');
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
            
            console.log('Mounting PaymentElement...');
            this.paymentElement.mount(this.paymentElementRef.nativeElement);
            
            this.paymentElement.on('ready', () => {
              console.log('PaymentElement is ready!');
              this.isStripeLoading = false;
              // Force a resize event to ensure Stripe recalculates height
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
              }, 100);
            });

            this.paymentElement.on('loaderror', (event: any) => {
              console.error('Stripe Load Error:', event.error);
              this.isStripeLoading = false;
              this.errorMessage = 'ไม่สามารถโหลดฟอร์มชำระเงินได้ เนื่องจากปัญหาการเชื่อมต่อ กรุณารีเฟรชหน้าจอหรือตรวจสอบอินเทอร์เน็ตของคุณ';
            });

            this.paymentElement.on('change', (event: any) => {
              this.errorMessage = event.error ? event.error.message : '';
            });
          },
          error: (err) => {
            console.error('SetupIntent Error', err);
            this.isStripeLoading = false;
            this.errorMessage = 'ไม่สามารถเชื่อมต่อกับระบบชำระเงินได้ในขณะนี้';
          }
        });
      },
      error: (err) => {
        console.error('Settings Error', err);
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
        console.error('Failed to load methods', err);
        this.isLoading = false;
      }
    });
  }

  async handleSubmit() {
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
      alert('บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว');
      // Re-init payment element to clear it
      await this.initStripe();
    }
  }

  deleteMethod(id: string) {
    if (confirm('ยืนยันการลบบัตรนี้?')) {
      this.billingService.deletePaymentMethod(id).subscribe(() => {
        this.loadPaymentMethods();
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
