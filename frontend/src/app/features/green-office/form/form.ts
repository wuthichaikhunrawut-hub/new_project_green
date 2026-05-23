import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AssessmentCardComponent } from '../../../shared/components/assessment/assessment-card/assessment-card';
import { timeout } from 'rxjs';
import { AssessmentDataService } from '../../../core/services/assessment-data.service';

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
        details: '',
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
          self_score: q.score || 0
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

  downloadPDF() {
    this.toast.success('กำลังสร้างรายงานประเมินตนเอง (PDF)... กรุณารอสักครู่');
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
    this.toast.success('AI กำลังวิเคราะห์ข้อมูลการประเมิน...\nข้อแนะนำเบื้องต้น: หมวดที่ 1 ควรเพิ่มหลักฐานภาพถ่ายการประชุมคณะทำงานเพื่อให้ได้คะแนนเต็ม');
  }
}
