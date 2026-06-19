import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AssessmentCardComponent } from '../../../shared/components/assessment/assessment-card/assessment-card';
import { timeout } from 'rxjs';
import { AssessmentDataService } from '../../../core/services/assessment-data.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Category {
  id: number;
  title: string;
  progress: number;
  status: string;
  totalWeight: number;
  currentScore: number;
}

interface Question {
  detailId: number;
  id: string;
  title: string;
  description: string;
  implementationStatus: string;
  score: number | null;
  details: string;
  fileCount: number;
  status: string;
  max_score: number;
}

@Component({
  selector: 'app-green-office-form',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, AssessmentCardComponent],
  templateUrl: './form.html',
  styleUrl: './form.css'
})
export class GreenOfficeFormComponent implements OnInit {
  private toast = inject(ToastService);


  // ชื่อหมวด (title) hardcode ไว้เพราะ DB ไม่มีเก็บ
  private categoryTitles: { [key: number]: string } = {
    1: 'หมวดที่ 1 การกำหนดนโยบายและการวางแผน',
    2: 'หมวดที่ 2 การสื่อสารและสร้างจิตสำนึก',
    3: 'หมวดที่ 3 การใช้ทรัพยากรและพลังงาน',
    4: 'หมวดที่ 4 การจัดการของเสีย',
    5: 'หมวดที่ 5 สภาพแวดล้อมและความปลอดภัย',
    6: 'หมวดที่ 6 การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม',
    7: 'หมวดที่ 7 การดำเนินงานเพื่อความต่อเนื่อง',
  };

  private categoryWeights: { [key: number]: number } = {
    1: 25, 2: 15, 3: 15, 4: 15, 5: 15, 6: 15, 7: 10,
  };

  categories: Category[] = [];
  allQuestions: { [key: number]: Question[] } = {};

  activeCategory = 1;
  isLoading = true;
  errorMsg = '';
  assessmentId: number | null = null;
  showAIModal = false;
  aiLoading = false;
  aiResult: any = null;
  private http = inject(HttpClient);

  questions: Question[] = [];
  activeSubCategory: string = '';
  subCategories: string[] = [];

  private cdr = inject(ChangeDetectorRef);

  constructor(private assessmentData: AssessmentDataService) {}

  ngOnInit(): void {
    this.loadCriteria();
  }

  loadCriteria(): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.assessmentData.getDraft().pipe(
      timeout(8000)
    ).subscribe({
      next: (data: any) => {
        try {
          if (!data || !data.details || data.details.length === 0) {
            this.errorMsg = 'ไม่พบข้อมูลแบบร่างประเมินในระบบ (Data is empty)';
            this.isLoading = false;
            return;
          }
          this.assessmentId = data.id;
          this.buildFromApiData(data.details);
          this.cdr.markForCheck();
        } catch (e: any) {
          console.error('Error parsing assessment data:', e);
          this.errorMsg = 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล: ' + e.message;
        } finally {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Failed to load assessment draft', err);
        if (err.name === 'TimeoutError') {
          this.errorMsg = 'การเชื่อมต่อล่าช้าเกินไป (Connection Timeout) กรุณาตรวจสอบอินเทอร์เน็ตหรือติดต่อผู้ดูแลระบบ';
        } else {
          this.errorMsg = 'ไม่สามารถโหลดข้อมูลแบบร่างได้ (' + (err.message || err.statusText || 'Unknown Error') + ')';
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildFromApiData(details: any[]): void {
    // สร้าง allQuestions โดยจัดกลุ่มตาม category_number
    const grouped: { [key: number]: Question[] } = {};
    const catNums = new Set<number>();

    for (const detail of details) {
      const item = detail.criteria;
      const catNum = item.category_number ?? 1;
      catNums.add(catNum);
      if (!grouped[catNum]) grouped[catNum] = [];
      grouped[catNum].push({
        detailId: detail.id,
        id: item.criteria_code || String(item.id),
        title: item.criteria_name,
        description: item.description || '',
        implementationStatus: detail.self_score > 0 ? 'implemented' : 'none',
        score: detail.self_score || null,
        details: detail.applicant_comment || '',
        fileCount: detail.evidence_files ? detail.evidence_files.length : 0,
        status: detail.self_score > 0 ? 'ดำเนินการแล้ว' : 'ยังไม่เริ่ม',
        max_score: item.max_score ?? 5,
      });
    }
    this.allQuestions = grouped;

    // สร้าง categories จาก catNums ที่มีจริงใน DB
    const sortedCatNums = Array.from(catNums).sort((a, b) => a - b);
    this.categories = sortedCatNums.map(num => ({
      id: num,
      title: this.categoryTitles[num] ?? `หมวดที่ ${num}`,
      progress: 0,
      status: 'pending',
      totalWeight: this.categoryWeights[num] ?? 10,
      currentScore: 0,
    }));

    // อัปเดต Radar Chart Labels
    this.radarChartLabels = this.categories.map(c => `หมวด ${c.id}`);
    this.radarChartData = {
      labels: this.radarChartLabels,
      datasets: [{
        ...this.radarChartData.datasets[0],
        data: this.categories.map(() => 0),
      }]
    };

    // เลือก category แรกเป็นค่าเริ่มต้น
    if (this.categories.length > 0) {
      this.selectCategory(this.categories[0].id);
      this.recalculateAllCategoriesProgress();
    }
  }

  recalculateAllCategoriesProgress() {
    this.categories.forEach(cat => {
      const questions = this.allQuestions[cat.id] ?? [];
      const answeredCount = questions.filter(q => q.score !== null && q.score > 0).length;
      cat.progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

      const sumScores = questions.reduce((acc, q) => acc + (q.score || 0), 0);
      const maxPossible = questions.reduce((acc, q) => acc + (q.max_score || 5), 0);
      cat.currentScore = maxPossible > 0
        ? Number(((sumScores / maxPossible) * cat.totalWeight).toFixed(2))
        : 0;

      if (cat.progress === 100) cat.status = 'completed';
      else if (cat.progress > 0) cat.status = 'in-progress';
      else cat.status = 'pending';
    });

    this.radarChartData = {
      labels: this.radarChartLabels,
      datasets: [{
        ...this.radarChartData.datasets[0],
        data: this.categories.map(c => (c.currentScore / c.totalWeight) * 100)
      }]
    };
  }

  get filteredQuestions(): Question[] {
    if (!this.activeSubCategory) return this.questions;
    return this.questions.filter(q => q.id.startsWith(this.activeSubCategory + '.'));
  }

  get activeCategoryTitle(): string {
    const category = this.categories.find(c => c.id === this.activeCategory);
    return category ? category.title : '';
  }

  get activeCategoryData(): Category {
    return this.categories.find(c => c.id === this.activeCategory) ?? this.categories[0];
  }

  get totalScore(): number {
    return Number(this.categories.reduce((acc, cat) => acc + cat.currentScore, 0).toFixed(2));
  }

  get assessmentLevel(): string {
    const score = this.totalScore;
    if (score >= 90) return 'ดีเยี่ยม (G Gold)';
    if (score >= 80) return 'ดีมาก (G Silver)';
    if (score >= 60) return 'ดี (G Bronze)';
    return 'ควรปรับปรุง';
  }

  get levelClass(): string {
    const level = this.assessmentLevel;
    if (level.includes('Gold')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (level.includes('Silver')) return 'bg-slate-200 text-slate-700 border-slate-300';
    if (level.includes('Bronze')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }

  // ── Radar Chart ──
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: {
          font: { family: "'IBM Plex Sans Thai', sans-serif", size: 10, weight: 'bold' },
          color: '#64748b'
        },
        ticks: { display: false, stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: { legend: { display: false } }
  };

  public radarChartLabels: string[] = [];
  public radarChartData: ChartData<'radar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'คะแนนเฉลี่ย (%)',
      backgroundColor: 'rgba(22, 163, 74, 0.2)',
      borderColor: '#16a34a',
      pointBackgroundColor: '#16a34a',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#16a34a',
      borderWidth: 3,
    }]
  };
  public radarChartType: ChartType = 'radar';

  selectCategory(id: number) {
    this.activeCategory = id;
    this.questions = this.allQuestions[id] ?? [];

    const subSet = new Set<string>();
    this.questions.forEach(q => {
      const parts = q.id.split('.');
      if (parts.length >= 2) subSet.add(`${parts[0]}.${parts[1]}`);
    });
    this.subCategories = Array.from(subSet).sort();
    this.activeSubCategory = this.subCategories.length > 0 ? this.subCategories[0] : '';
  }

  selectSubCategory(subId: string) {
    this.activeSubCategory = subId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextSubCategory() {
    const currentIndex = this.subCategories.indexOf(this.activeSubCategory);
    if (currentIndex < this.subCategories.length - 1) {
      this.selectSubCategory(this.subCategories[currentIndex + 1]);
    } else {
      const catIndex = this.categories.findIndex(c => c.id === this.activeCategory);
      if (catIndex < this.categories.length - 1) {
        this.selectCategory(this.categories[catIndex + 1].id);
      }
    }
  }

  prevSubCategory() {
    const currentIndex = this.subCategories.indexOf(this.activeSubCategory);
    if (currentIndex > 0) {
      this.selectSubCategory(this.subCategories[currentIndex - 1]);
    } else {
      const catIndex = this.categories.findIndex(c => c.id === this.activeCategory);
      if (catIndex > 0) {
        this.selectCategory(this.categories[catIndex - 1].id);
        this.activeSubCategory = this.subCategories[this.subCategories.length - 1];
      }
    }
  }

  onCardChanged(index: number, event: any) {
    // หา index จริงใน this.questions จาก filteredQuestions
    const changedQ = this.filteredQuestions[index];
    const realIndex = this.questions.findIndex(q => q.id === changedQ.id);
    if (realIndex > -1) {
      this.questions[realIndex] = { ...this.questions[realIndex], ...event };
    }
    this.recalculateProgress();
  }

  recalculateProgress() {
    const catIndex = this.categories.findIndex(c => c.id === this.activeCategory);
    if (catIndex > -1) {
      const cat = this.categories[catIndex];
      const questions = this.allQuestions[cat.id] ?? [];

      const answeredCount = questions.filter(q => q.score !== null).length;
      cat.progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

      const sumScores = questions.reduce((acc, q) => acc + (q.score || 0), 0);
      const maxPossible = questions.reduce((acc, q) => acc + (q.max_score || 5), 0);
      cat.currentScore = maxPossible > 0
        ? Number(((sumScores / maxPossible) * cat.totalWeight).toFixed(2))
        : 0;

      if (cat.progress === 100) cat.status = 'completed';
      else if (cat.progress > 0) cat.status = 'in-progress';
      else cat.status = 'pending';
    }

    this.radarChartData = {
      labels: this.radarChartLabels,
      datasets: [{
        ...this.radarChartData.datasets[0],
        data: this.categories.map(c => (c.currentScore / c.totalWeight) * 100)
      }]
    };
  }

  saveProgress() {
    if (!this.assessmentId) return;

    const detailsToUpdate: any[] = [];
    for (const catId in this.allQuestions) {
      this.allQuestions[catId].forEach(q => {
        detailsToUpdate.push({
          assessment_detail_id: q.detailId,
          self_score: q.score || 0,
          applicant_comment: q.details || ''
        });
      });
    }

    const payload = {
      total_score: this.totalScore,
      details: detailsToUpdate
    };

    this.toast.success('กำลังบันทึกข้อมูลแบบร่าง...');
    this.assessmentData.updateDraft(this.assessmentId, payload).subscribe({
      next: () => this.toast.success('บันทึกฉบับร่างเรียบร้อยแล้ว!'),
      error: () => this.toast.error('ไม่สามารถบันทึกแบบร่างได้ กรุณาลองใหม่อีกครั้ง')
    });
  }

  async downloadPDF() {
    this.toast.success('กำลังสร้างรายงานประเมินตนเอง (PDF)... กรุณารอสักครู่');
    
    try {
      const { jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '-9999px';
      printContainer.style.width = '800px';
      printContainer.style.padding = '0';
      printContainer.style.background = '#ffffff';
      printContainer.style.color = '#1e293b';

      let htmlContent = `
        <div style="font-family: 'Sarabun', 'Inter', sans-serif; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <!-- Top Premium Banner -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 40px; color: #ffffff; border-bottom: 4px solid #10b981; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="color: #34d399; margin: 0 0 5px 0; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Green Sync Platform</h4>
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; line-height: 1.2;">รายงานผลการประเมินตนเองอย่างเป็นทางการ</h1>
                <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px;">โครงการประเมินสำนักงานสีเขียวที่เป็นมิตรกับสิ่งแวดล้อม (Green Office)</p>
              </div>
              <div style="border: 2px double #34d399; padding: 12px; border-radius: 8px; text-align: center; background: rgba(255,255,255,0.05); min-width: 130px;">
                <div style="color: #a7f3d0; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">ระดับผลการประเมิน</div>
                <div style="color: #ffffff; font-size: 16px; font-weight: 800;">${this.assessmentLevel}</div>
              </div>
            </div>
          </div>

          <div style="padding: 40px;">
            <!-- Document Meta Details Grid -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 35px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
              <div>
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">ข้อมูลองค์กรและสิทธิ์</span>
                <span style="display: block; font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 12px;">บัญชีผู้ดูแลระบบองค์กร (Organization Admin)</span>
                
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">รหัสการประเมิน</span>
                <span style="display: block; font-size: 14px; font-family: monospace; font-weight: bold; color: #334155;">GS-SELF-${this.assessmentId || 'NEW-001'}</span>
              </div>
              <div style="text-align: right;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">วันที่จัดทำรายงาน</span>
                <span style="display: block; font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 12px;">${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">มาตรฐานอ้างอิง</span>
                <span style="display: block; font-size: 14px; font-weight: bold; color: #047857;">Green Office 2569</span>
              </div>
            </div>

            <!-- Side-by-Side Premium Summary Cards -->
            <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 40px;">
              <!-- Score Showcase Card -->
              <div style="flex: 1; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase; margin-bottom: 8px;">คะแนนรวมที่ได้</span>
                <span style="font-size: 40px; font-weight: 900; color: #047857;">${this.totalScore}</span>
                <span style="font-size: 16px; color: #065f46; font-weight: 700;">/ 100</span>
                <span style="display: block; font-size: 11px; color: #065f46; margin-top: 8px; opacity: 0.8;">*คะแนนถ่วงน้ำหนักเฉลี่ยสมบูรณ์</span>
              </div>

              <!-- Status Grade Card -->
              <div style="flex: 1; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin-bottom: 8px;">เกณฑ์ประเมินเบื้องต้น</span>
                <span style="display: block; font-size: 26px; font-weight: 900; color: #1d4ed8; margin: 10px 0 5px 0;">ผ่านเกณฑ์มาตรฐาน</span>
                <span style="display: block; font-size: 12px; color: #1e40af; opacity: 0.8;">พร้อมสำหรับการยื่นขอรับตรวจประเมินจริง</span>
              </div>
            </div>

            <!-- Table Section -->
            <h5 style="font-size: 16px; color: #0f172a; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px; margin-bottom: 20px;">
              รายละเอียดและผลคะแนนจำแนกตามหมวดหมู่
            </h5>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 45px;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="padding: 14px 16px; font-size: 12px; font-weight: bold; color: #475569; border-radius: 8px 0 0 8px;">หมวดหมู่การประเมิน (Green Office Criteria)</th>
                  <th style="padding: 14px 16px; font-size: 12px; font-weight: bold; color: #475569; text-align: center; width: 100px;">สัดส่วน</th>
                  <th style="padding: 14px 16px; font-size: 12px; font-weight: bold; color: #475569; text-align: left; width: 180px;">ความคืบหน้า</th>
                  <th style="padding: 14px 16px; font-size: 12px; font-weight: bold; color: #475569; text-align: right; border-radius: 0 8px 8px 0; width: 110px;">คะแนนประเมิน</th>
                </tr>
              </thead>
              <tbody>
      `;

      this.categories.forEach(cat => {
        htmlContent += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 16px; font-size: 13px; font-weight: bold; color: #1e293b;">${cat.title}</td>
            <td style="padding: 16px; font-size: 13px; text-align: center; color: #64748b;">${cat.totalWeight} คะแนน</td>
            <td style="padding: 16px; vertical-align: middle;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${cat.progress === 100 ? '#047857' : '#b45309'};">${cat.progress}%</span>
                <div style="flex: 1; background-color: #f1f5f9; height: 6px; border-radius: 9999px; overflow: hidden; min-width: 100px; border: 1px solid #e2e8f0;">
                  <div style="background-color: ${cat.progress === 100 ? '#10b981' : '#f59e0b'}; height: 6px; border-radius: 9999px; width: ${cat.progress}%;"></div>
                </div>
              </div>
            </td>
            <td style="padding: 16px; font-size: 13px; text-align: right; font-weight: bold; color: #047857;">${cat.currentScore} / ${cat.totalWeight}</td>
          </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>

            <!-- Signatures and Digital Stamp Seal Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 40px; margin-bottom: 15px;">
              <!-- Official Stamp (Left) -->
              <div style="text-align: left; flex: 1;">
                <div style="border: 3px double #059669; padding: 12px 18px; color: #059669; font-weight: 900; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; border-radius: 8px; transform: rotate(-4deg); display: inline-block; background: #f0fdf4; border-style: double;">
                  <i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> GREEN SYNC CERTIFIED
                  <div style="font-size: 9px; font-weight: bold; margin-top: 4px; letter-spacing: 0px; text-align: center; color: #047857;">DIGITAL SUBMISSION SEAL</div>
                </div>
              </div>

              <!-- Audited & Approved Line (Right) -->
              <div style="text-align: right; min-width: 250px;">
                <div style="margin-bottom: 45px; border-bottom: 1px dashed #94a3b8; width: 100%; height: 20px;"></div>
                <div style="font-size: 13px; font-weight: bold; color: #334155;">ผู้รับผิดชอบการประเมินตนเอง</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">แอดมินผู้ดูแลระบบความยั่งยืนขององค์กร</div>
              </div>
            </div>

          </div>

          <!-- Premium Corporate Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #94a3b8;">เอกสารรายงานประเมินอย่างเป็นทางการเลขที่: GS-REP-${this.assessmentId || '001'}</span>
            <span style="font-size: 10px; color: #94a3b8;">ลิขสิทธิ์ © ${new Date().getFullYear()} Green Sync. All Rights Reserved.</span>
          </div>
        </div>
      `;

      printContainer.innerHTML = htmlContent;
      document.body.appendChild(printContainer);

      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`GreenSync_Self_Assessment_${this.assessmentId || 'Report'}.pdf`);
      
      document.body.removeChild(printContainer);
      this.toast.success('ดาวน์โหลดรายงาน PDF สำเร็จแล้ว!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toast.error('ไม่สามารถดาวน์โหลด PDF ได้ในขณะนี้');
    }
  }

  submitAssessment() {
    const isAllComplete = this.categories.every(c => c.progress === 100);
    const incompleteItems: string[] = [];

    for (const catId in this.allQuestions) {
      this.allQuestions[catId].forEach(q => {
        if (q.score === 5 && q.fileCount === 0) incompleteItems.push(q.id);
      });
    }

    if (incompleteItems.length > 0) {
      this.toast.error(`ไม่สามารถส่งแบบประเมินได้:\nข้อต่อไปนี้ได้รับคะแนนเต็ม แต่ยังไม่มีการแนบหลักฐาน: ${incompleteItems.join(', ')}`);
      return;
    }

    if (isAllComplete) {
      if (!this.assessmentId) return;
      const payload = { status: 'SUBMITTED', total_score: this.totalScore };
      this.assessmentData.updateDraft(this.assessmentId, payload).subscribe({
        next: () => this.toast.success('ส่งแบบประเมินเรียบร้อยแล้ว! คณะกรรมการจะดำเนินการตรวจประเมินในลำดับถัดไป'),
        error: () => this.toast.error('เกิดข้อผิดพลาดในการส่งแบบประเมิน')
      });
    } else {
      this.toast.success('กรุณากรอกข้อมูลให้ครบทุกหมวดก่อนส่งแบบประเมิน');
    }
  }

  analyzeAI() {
    const weakPoints: any[] = [];
    Object.keys(this.allQuestions).forEach((catId: any) => {
      const qs = this.allQuestions[catId];
      qs.forEach(q => {
        if (q.score !== null && q.score < q.max_score) {
          weakPoints.push({
            id: q.id,
            title: q.title,
            score: q.score,
            maxScore: q.max_score,
            comment: q.details
          });
        }
      });
    });

    this.aiLoading = true;
    this.showAIModal = true;
    this.aiResult = null;
    this.cdr.markForCheck();

    this.http.post<any>(`${environment.apiUrl}/gemini/recommendations`, { weakPoints }).subscribe({
      next: (res) => {
        this.aiResult = res;
        this.aiLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('AI Recommendations call failed:', err);
        this.toast.error('ไม่สามารถดึงข้อมูลวิเคราะห์จาก AI ได้ในขณะนี้');
        this.aiLoading = false;
        this.showAIModal = false;
        this.cdr.markForCheck();
      }
    });
  }
}
