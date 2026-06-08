import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GreenCriteriaService, GreenCriteria } from '../../../core/services/green-criteria.service';
import { RequestsService } from '../../../core/services/requests.service';
import { Assessment, AssessmentDetail } from '../../../core/models/assessment.model';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';
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
  selfScore: number;
  applicantComment: string;
  maxScore: number;
}

interface UploadedFile {
  id?: number;
  name: string;
  size: string;
  url?: string;
}

@Component({
  selector: 'app-assessment-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category.html',
  styleUrls: ['./category.css']
})
export class CategoryPageComponent implements OnInit {
  private toast = inject(ToastService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private criteriaService = inject(GreenCriteriaService);
  private requestsService = inject(RequestsService);

  categoryId: number = 1;
  categoryData: CategoryData | null = null;
  activeAssessment: Assessment | null = null;
  allCriteria: GreenCriteria[] = [];

  // Metadata for categories 1-7
  private categoryTitles = [
    '',
    'การกำหนดนโยบาย การวางแผน',
    'การสื่อสารและสร้างจิตสำนึก',
    'การใช้ทรัพยากรและพลังงาน',
    'การจัดการของเสีย',
    'สภาพแวดล้อมและความปลอดภัย',
    'การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม',
    'การดำเนินงานเพื่อความต่อเนื่อง'
  ];
  
  private categoryDescriptions = [
    '',
    'ประเมินการตั้งเป้าหมายและนโยบายด้านสิ่งแวดล้อมขององค์กร',
    'การรณรงค์และให้ความรู้พนักงานในองค์กร',
    'มาตรการประหยัดไฟฟ้า น้ำ และกระดาษ',
    'การคัดแยกขยะและการลดปริมาณขยะ',
    'การจัดการพื้นที่ทำงานให้ปลอดภัยและน่าอยู่',
    'การเลือกซื้อสินค้าที่มีฉลากรับรองสิ่งแวดล้อม',
    'การดำเนินงานเพื่อความยั่งยืนและความต่อเนื่องขององค์กร'
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
        files: files,
        selfScore: detail?.self_score || 0,
        applicantComment: detail?.applicant_comment || '',
        maxScore: criteria.max_score || 0
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

  @ViewChild('fileInput') fileInput!: ElementRef;
  private uploadService = inject(UploadService);
  private authService = inject(AuthService);
  private currentQuestionId: string | null = null;
  isUploading = false;
  
  // New: Store files selected but not yet uploaded
  pendingFiles: { [questionId: string]: File[] } = {};

  triggerUpload(questionId: string) {
    this.currentQuestionId = questionId;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file && this.currentQuestionId) {
      if (!this.pendingFiles[this.currentQuestionId]) {
        this.pendingFiles[this.currentQuestionId] = [];
      }
      this.pendingFiles[this.currentQuestionId].push(file);
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  }

  removePendingFile(questionId: string, index: number) {
    if (this.pendingFiles[questionId]) {
      this.pendingFiles[questionId].splice(index, 1);
    }
  }

  confirmUpload(questionId: string) {
    const files = this.pendingFiles[questionId];
    if (!files || files.length === 0) return;

    this.isUploading = true;
    const userId = this.authService.getUser()?.id;
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    
    if (!question) return;

    // Upload each file (could use forkJoin for parallel but let's keep it simple for now)
    const uploadObservables = files.map(file => 
      this.uploadService.uploadFile(file, 'assessment', { 
        assessmentDetailId: question.detailId,
        userId 
      })
    );

    // Using recursion or forkJoin would be better, but let's do sequential for clarity
    this.processUploads(questionId, files, 0);
  }

  private processUploads(questionId: string, files: File[], index: number) {
    if (index >= files.length) {
      this.pendingFiles[questionId] = [];
      this.isUploading = false;
      this.recalculateProgress();
      this.toast.success('อัปโหลดไฟล์หลักฐานสำเร็จ!');
      return;
    }

    const file = files[index];
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    const userId = this.authService.getUser()?.id;

    this.uploadService.uploadFile(file, 'assessment', { 
      assessmentDetailId: question?.detailId,
      userId 
    }).subscribe({
      next: (res) => {
        if (question) {
          question.files.push({ 
            id: res.id,
            name: res.file_name, 
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            url: res.file_url
          });
          question.status = 'uploaded';
        }
        this.processUploads(questionId, files, index + 1);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.toast.error(`เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${file.name}`);
        this.isUploading = false;
      }
    });
  }

  deleteFile(questionId: string, fileIndex: number) {
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    if (question && question.files[fileIndex]) {
      const fileToDelete = question.files[fileIndex];
      
      if (fileToDelete.id && confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้ถาวร?')) {
        this.isUploading = true;
        this.uploadService.deleteFile(fileToDelete.id).subscribe({
          next: () => {
            question.files.splice(fileIndex, 1);
            if (question.files.length === 0) {
              question.status = 'pending';
            }
            this.isUploading = false;
            this.recalculateProgress();
            this.toast.success('ลบไฟล์เรียบร้อยแล้วครับ!');
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.isUploading = false;
            this.toast.error('เกิดข้อผิดพลาดในการลบไฟล์');
          }
        });
      }
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
    const maxCategory = this.allCriteria.some(c => c.category_number === 7) ? 7 : 6;
    if (this.categoryId < maxCategory) {
      this.router.navigate(['/assessment/category', this.categoryId + 1]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  viewFile(file: any) {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      this.toast.success('ไม่พบ URL สำหรับเปิดไฟล์นี้ครับ');
    }
  }

  saveDetail(q: Question) {
    if (!this.activeAssessment || !q.detailId) return;
    
    this.requestsService.updateRequest(this.activeAssessment.id.toString(), {
      details: [{
        assessment_detail_id: q.detailId,
        self_score: q.selfScore,
        applicant_comment: q.applicantComment
      }]
    } as any).subscribe({
      next: () => {
        this.toast.success('บันทึกข้อมูลประเมินตนเองสำเร็จ');
      },
      error: () => {
        this.toast.error('บันทึกข้อมูลไม่สำเร็จ');
      }
    });
  }
}
