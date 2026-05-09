import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GreenCriteriaService, GreenCriteria } from '../../../core/services/green-criteria.service';
import { RequestsService } from '../../../core/services/requests.service';
import { Assessment, AssessmentDetail } from '../../../core/models/assessment.model';
import { forkJoin } from 'rxjs';

interface CategoryData {
  id: number;
  title: string;
  description: string;
  totalScore: number;
  progress: number;
  questions: Question[];
}

interface Question {
  id: string;
  detailId?: number;
  text: string;
  description?: string;
  status: 'pending' | 'uploaded' | 'rejected' | 'approved';
  files: UploadedFile[];
}

interface UploadedFile {
  name: string;
  size: string;
}

@Component({
  selector: 'app-assessment-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category.html',
  styleUrls: ['./category.css']
})
export class CategoryPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private criteriaService = inject(GreenCriteriaService);
  private requestsService = inject(RequestsService);

  categoryId: number = 1;
  categoryData: CategoryData | null = null;
  activeAssessment: Assessment | null = null;
  allCriteria: GreenCriteria[] = [];

  // Metadata for categories 1-6
  private categoryTitles = [
    '',
    'การกำหนดนโยบาย การวางแผน',
    'การสื่อสารและสร้างจิตสำนึก',
    'การใช้ทรัพยากรและพลังงาน',
    'การจัดการของเสีย',
    'สภาพแวดล้อมและความปลอดภัย',
    'การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม'
  ];
  
  private categoryDescriptions = [
    '',
    'ประเมินการตั้งเป้าหมายและนโยบายด้านสิ่งแวดล้อมขององค์กร',
    'การรณรงค์และให้ความรู้พนักงานในองค์กร',
    'มาตรการประหยัดไฟฟ้า น้ำ และกระดาษ',
    'การคัดแยกขยะและการลดปริมาณขยะ',
    'การจัดการพื้นที่ทำงานให้ปลอดภัยและน่าอยู่',
    'การเลือกซื้อสินค้าที่มีฉลากรับรองสิ่งแวดล้อม'
  ];

  ngOnInit() {
    // Load all required data first
    forkJoin({
      criteria: this.criteriaService.getCriteriaList(),
      requests: this.requestsService.getRequests()
    }).subscribe({
      next: (res) => {
        this.allCriteria = res.criteria;
        
        // Find an active assessment or use the first one
        if (res.requests && res.requests.length > 0) {
          this.activeAssessment = res.requests[0];
          // If details are missing, fetch by ID to ensure full relation
          if (!this.activeAssessment.details && this.activeAssessment.id) {
            this.requestsService.getRequestById(String(this.activeAssessment.id)).subscribe(fullReq => {
              this.activeAssessment = fullReq;
              this.subscribeToRoute();
            });
            return;
          }
        }
        this.subscribeToRoute();
      },
      error: (err) => {
        console.error('Failed to load assessment data', err);
        this.subscribeToRoute(); // fallback to render empty or partial
      }
    });
  }

  private subscribeToRoute() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.categoryId = idParam ? parseInt(idParam, 10) : 1;
      this.buildCategoryData(this.categoryId);
    });
  }

  buildCategoryData(id: number) {
    // Filter criteria for this specific category
    const categoryCriteria = this.allCriteria.filter(c => c.category_number === id);
    
    // Calculate total max score for this category
    const totalScore = categoryCriteria.reduce((sum, c) => sum + (c.max_score || 0), 0);

    const questions: Question[] = categoryCriteria.map(criteria => {
      // Find matching assessment detail
      const detail = this.activeAssessment?.details?.find((d: AssessmentDetail) => d.criteria?.id === criteria.id);
      
      let status: 'pending' | 'uploaded' | 'rejected' | 'approved' = 'pending';
      const files: UploadedFile[] = [];

      if (detail) {
        // Evaluate status based on detail data
        if (detail.assessor_score && detail.assessor_score >= (criteria.max_score || 5) * 0.5) {
          status = 'approved';
        } else if (detail.evidence_files && detail.evidence_files.length > 0) {
          status = 'uploaded';
          // Map real files if available
          detail.evidence_files.forEach((f: any) => {
            files.push({ name: f.file_name || 'document.pdf', size: 'Unknown' });
          });
        } else if (detail.auditor_comment) {
          status = 'rejected';
        }
      }

      return {
        id: criteria.criteria_code || '?',
        detailId: detail?.id,
        text: criteria.criteria_name,
        description: criteria.description,
        status: status,
        files: files
      };
    });

    // Calculate progress (approved/uploaded = done)
    const completed = questions.filter(q => q.status === 'approved' || q.status === 'uploaded').length;
    const progress = questions.length > 0 ? Math.round((completed / questions.length) * 100) : 0;

    this.categoryData = {
      id: id,
      title: `หมวดที่ ${id} ${this.categoryTitles[id] || ''}`,
      description: this.categoryDescriptions[id] || '',
      totalScore: totalScore > 0 ? totalScore : 15,
      progress: progress,
      questions: questions
    };
  }

  get progressPercentage(): number {
    return this.categoryData?.progress || 0;
  }

  triggerUpload(questionId: string) {
    // Keep mock upload action for UX preview until actual file upload API is integrated
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    if (question) {
      question.files.push({ name: `evidence_document_${Date.now().toString().slice(-4)}.pdf`, size: '1.5 MB' });
      question.status = 'uploaded';
      
      this.recalculateProgress();
    }
  }

  deleteFile(questionId: string, fileIndex: number) {
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    if (question) {
      question.files.splice(fileIndex, 1);
      if (question.files.length === 0) {
        question.status = 'pending';
      }
      this.recalculateProgress();
    }
  }

  private recalculateProgress() {
    if (this.categoryData) {
      const completed = this.categoryData.questions.filter(q => q.status === 'approved' || q.status === 'uploaded').length;
      this.categoryData.progress = Math.round((completed / this.categoryData.questions.length) * 100);
    }
  }

  goPrevious() {
    if (this.categoryId > 1) {
      this.router.navigate(['/assessment/category', this.categoryId - 1]);
    }
  }

  goNext() {
    if (this.categoryId < 6) {
      this.router.navigate(['/assessment/category', this.categoryId + 1]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
