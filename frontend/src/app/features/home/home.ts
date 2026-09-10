import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserSubscriptionsService } from '../../core/services/user-subscriptions.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  private userSubService = inject(UserSubscriptionsService);
  private platformId = inject(PLATFORM_ID);

  heroSlides = [
    {
      image: 'assets/image/royal_blessing.jpg',
      isRoyalBlessing: true,
      badge: '',
      titleTh: '',
      titleEn: '',
      subtitleTh: '',
      primaryCta: '',
      secondaryCta: '',
    },
    {
      image: 'assets/image/002.png',
      isRoyalBlessing: false,
      badge: 'AI-Powered Enterprise Platform',
      titleTh: 'ยกระดับองค์กรสู่ Net Zero ด้วยพลัง AI',
      titleEn: 'Decarbonize Your Organization with AI',
      subtitleTh:
        'แพลตฟอร์ม ESG และ Carbon Footprint ระดับ Enterprise สำหรับองค์กรยุคใหม่ ครบถ้วนตามมาตรฐาน สวยงาม และใช้งานง่ายที่สุด',
      primaryCta: 'เริ่มต้นใช้งานฟรี',
      secondaryCta: 'ข้อมูลองค์กร',
    },
  ];

  plans: any[] = [];
  plansLoading = true;
  plansLoadError = false;

  currentSlideIndex = 0;
  slideInterval: any;
  isMobileMenuOpen = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startSlideShow();
      this.loadPlans();
    }
  }

  loadPlans() {
    this.userSubService.getPlans().subscribe({
      next: (res) => {
        this.plansLoading = false;
        if (res && res.length > 0) {
          // Map DB plans to badge formats if not explicitly set
          this.plans = res.map((plan: any, index: number) => {
            let badge = '';
            if (index === 0) badge = 'starter';
            else if (index === 1) badge = 'popular';
            else if (index === 2) badge = 'enterprise';
            return {
              ...plan,
              badge: plan.badge || badge,
            };
          });
        }
      },
      error: (err) => {
        this.plansLoading = false;
        this.plansLoadError = true;
        console.error('Failed to load plans from database:', err);
      },
    });
  }

  ngOnDestroy() {
    this.stopSlideShow();
  }

  startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Rotate every 5 seconds
  }

  stopSlideShow() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
    this.resetSlideShow();
  }

  prevSlide() {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.resetSlideShow();
  }

  setSlide(index: number) {
    this.currentSlideIndex = index;
    this.resetSlideShow();
  }

  resetSlideShow() {
    this.stopSlideShow();
    this.startSlideShow();
  }

  // Carbon Estimator State
  electricityCost = 15000; // THB/month
  gasolineLiters = 350; // Liters/month
  wasteKg = 200; // kg/month

  // Platform Explorer Active Tab
  activeTab = 'cfo'; // 'cfo' | 'green-office' | 'ai-ocr' | 'multi-org' | 'reports'

  // Dual Portal Active Role
  activePortal = 'org'; // 'org' | 'assessor'

  // Pricing Matrix State
  billingCycle = 'monthly'; // 'monthly' | 'yearly'

  // Interactive Workflow Step
  activeStep = 1; // 1 | 2 | 3

  // Carbon Calculation Getters
  get electricityEmission(): number {
    const kWh = this.electricityCost / 4.5;
    return (kWh * 0.4997 * 12) / 1000; // tCO2e/year
  }

  get fuelEmission(): number {
    return (this.gasolineLiters * 2.24 * 12) / 1000; // tCO2e/year
  }

  get wasteEmission(): number {
    return (this.wasteKg * 0.94 * 12) / 1000; // tCO2e/year
  }

  get totalEmission(): number {
    return this.electricityEmission + this.fuelEmission + this.wasteEmission;
  }

  get potentialSavings(): number {
    return this.totalEmission * 0.25; // 25% avg savings
  }

  get treesEquivalent(): number {
    return Math.round(this.potentialSavings / 0.009); // 1 tree ~ 9 kg CO2/year
  }

  // Update Estimator Methods
  updateElectricity(event: Event) {
    const input = event.target as HTMLInputElement;
    this.electricityCost = Number(input.value);
  }

  updateGasoline(event: Event) {
    const input = event.target as HTMLInputElement;
    this.gasolineLiters = Number(input.value);
  }

  updateWaste(event: Event) {
    const input = event.target as HTMLInputElement;
    this.wasteKg = Number(input.value);
  }

  // Actions
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  setActivePortal(portal: string) {
    this.activePortal = portal;
  }

  setActiveStep(step: number) {
    this.activeStep = step;
  }

  toggleBillingCycle() {
    this.billingCycle = this.billingCycle === 'monthly' ? 'yearly' : 'monthly';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  problemPoints = [
    {
      title: 'ข้อมูลกระจัดกระจาย',
      desc: 'ข้อมูลพลังงานและเอกสารจัดเก็บแยกหลายระบบ ทำให้ยากต่อการรวบรวมและตรวจสอบ',
      icon: 'fa-box-archive',
    },
    {
      title: 'การคำนวณที่ล่าช้า',
      desc: 'การใช้วิธีคำนวณแบบเดิมมีความซับซ้อน ใช้เวลานาน และเสี่ยงต่อความผิดพลาด',
      icon: 'fa-calculator',
    },
    {
      title: 'มาตรฐานที่ซับซ้อน',
      desc: 'ข้อกำหนด Green Office และ ESG มีรายละเอียดมากและเปลี่ยนแปลงอยู่เสมอ',
      icon: 'fa-file-shield',
    },
  ];

  features = [
    {
      id: 'ai-ocr',
      icon: 'fa-wand-magic-sparkles',
      titleEn: 'AI Intelligence',
      titleTh: 'ระบบ AI อัจฉริยะ',
      descTh: 'สแกนเอกสารและบิลค่าพลังงานด้วย AI ความแม่นยำสูง ลดงาน Manual ได้มากกว่า 90%',
      color: 'emerald',
    },
    {
      id: 'analytics',
      icon: 'fa-chart-pie',
      titleEn: 'Real-time Analytics',
      titleTh: 'วิเคราะห์ข้อมูล Real-time',
      descTh: 'แดชบอร์ดสรุปผลการปล่อยก๊าซเรือนกระจกรายเดือน พร้อมระบบ AI แนะนำจุดที่ควรปรับปรุง',
      color: 'blue',
    },
    {
      id: 'reporting',
      icon: 'fa-file-export',
      titleEn: 'Smart Reporting',
      titleTh: 'รายงานมาตรฐานสากล',
      descTh: 'ส่งออกรายงานตามมาตรฐาน Green Office และ ESG ได้ทันทีเพียงคลิกเดียว',
      color: 'indigo',
    },
    {
      id: 'multitenant',
      icon: 'fa-users-gear',
      titleEn: 'Enterprise Ready',
      titleTh: 'พร้อมสำหรับทุกขนาดองค์กร',
      descTh: 'รองรับการจัดการหลายหน่วยงาน (Multi-Org) พร้อมระบบจัดการสิทธิ์ที่ปลอดภัยและละเอียด',
      color: 'slate',
    },
  ];

  howItWorks = [
    {
      step: '01',
      title: 'การนำเข้าข้อมูล',
      desc: 'เชื่อมต่อข้อมูลหรืออัปโหลดบิลผ่านระบบ AI อัจฉริยะ',
    },
    {
      step: '02',
      title: 'ประมวลผลด้วย AI',
      desc: 'ระบบคำนวณและวิเคราะห์ตามมาตรฐานสากลโดยอัตโนมัติ',
    },
    {
      step: '03',
      title: 'สรุปผลและรายงาน',
      desc: 'ตรวจสอบผลลัพธ์ผ่านแดชบอร์ดและส่งออกรายงานได้ทันที',
    },
  ];

  stats = [
    { number: '500+', label: 'องค์กร', icon: 'fa-building' },
    { number: '120k', label: 'กิโลกรัมคาร์บอนที่ลดได้', icon: 'fa-leaf' },
    { number: '99.9%', label: 'ความแม่นยำ AI', icon: 'fa-microchip' },
    { number: 'Premium', label: 'มาตรฐาน ESG', icon: 'fa-award' },
  ];

  partners = [
    'https://upload.wikimedia.org/wikipedia/commons/e/e0/GISTDA_Logo.png',
    'https://www.tei.or.th/greenoffice/images/logo-green-office.png',
    'https://d1.awsstatic.com/logos/amazon-aws-logo.svg',
  ];
}
