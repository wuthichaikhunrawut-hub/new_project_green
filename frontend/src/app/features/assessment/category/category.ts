import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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

  categoryId: number = 1;
  categoryData: CategoryData | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.categoryId = idParam ? parseInt(idParam, 10) : 1;
      this.loadCategoryData(this.categoryId);
    });
  }

  loadCategoryData(id: number) {
    // Mock data generation based on category ID
    const titles = [
      '',
      'การกำหนดนโยบาย การวางแผน',
      'การสื่อสารและสร้างจิตสำนึก',
      'การใช้ทรัพยากรและพลังงาน',
      'การจัดการของเสีย',
      'สภาพแวดล้อมและความปลอดภัย',
      'การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม'
    ];
    
    const descriptions = [
      '',
      'ประเมินการตั้งเป้าหมายและนโยบายด้านสิ่งแวดล้อมขององค์กร',
      'การรณรงค์และให้ความรู้พนักงานในองค์กร',
      'มาตรการประหยัดไฟฟ้า น้ำ และกระดาษ',
      'การคัดแยกขยะและการลดปริมาณขยะ',
      'การจัดการพื้นที่ทำงานให้ปลอดภัยและน่าอยู่',
      'การเลือกซื้อสินค้าที่มีฉลากรับรองสิ่งแวดล้อม'
    ];

    const scores = [0, 25, 15, 15, 15, 15, 15];

    let questions: Question[] = [];

    // Base mock questions depending on category
    if (id === 1) {
      questions = [
        { id: '1.1', text: 'มีการกำหนดนโยบายสิ่งแวดล้อมที่ครอบคลุมการใช้ทรัพยากร พลังงาน และการจัดการของเสีย', description: 'นโยบายต้องได้รับการอนุมัติจากผู้บริหารสูงสุดและประกาศให้พนักงานทราบ', status: 'approved', files: [{ name: 'environmental_policy_2024.pdf', size: '2.4 MB' }] },
        { id: '1.2', text: 'มีการแต่งตั้งคณะทำงาน Green Office และกำหนดบทบาทหน้าที่ชัดเจน', description: 'คำสั่งแต่งตั้งต้องเป็นปัจจุบันและครอบคลุมทุกฝ่าย', status: 'uploaded', files: [{ name: 'committee_appointment.pdf', size: '1.1 MB' }] },
        { id: '1.3', text: 'มีการระบุและประเมินปัญหาสิ่งแวดล้อมลักษณะปัญหาสิ่งแวดล้อม (Environmental Aspect)', status: 'pending', files: [] },
        { id: '1.4', text: 'มีการกำหนดเป้าหมาย แผนงานโครงการ และวิธีดำเนินการอย่างชัดเจน', status: 'pending', files: [] }
      ];
    } else {
      // Generic mock questions for other categories
      questions = [
        { id: `${id}.1`, text: `ข้อกำหนดหลักหมวดที่ ${id} (ส่วนที่ 1)`, description: 'คำอธิบายเพิ่มเติมสำหรับการอัปโหลดหลักฐาน', status: 'pending', files: [] },
        { id: `${id}.2`, text: `ข้อกำหนดหลักหมวดที่ ${id} (ส่วนที่ 2)`, status: 'pending', files: [] }
      ];
      // Type assertion workaround for mock data
      questions[1].status = 'pending'; 
    }

    // Calculate mock progress (approved/uploaded = done)
    const completed = questions.filter(q => q.status === 'approved' || q.status === 'uploaded').length;
    const progress = questions.length > 0 ? Math.round((completed / questions.length) * 100) : 0;

    this.categoryData = {
      id: id,
      title: `หมวดที่ ${id} ${names[id] || titles[id]}`,
      description: descriptions[id] || '',
      totalScore: scores[id] || 15,
      progress: progress,
      questions: questions
    };
  }

  // Helper arrays for fallback naming
  private categoryNames = ['', 'นโยบายและการวางแผน', 'การสื่อสารและจิตสำนึก', 'ทรัพยากรและพลังงาน', 'การจัดการของเสีย', 'สภาพแวดล้อม', 'การจัดซื้อสีเขียว'];

  // Calculate generic progress percentage directly (for styling width)
  get progressPercentage(): number {
    return this.categoryData?.progress || 0;
  }

  triggerUpload(questionId: string) {
    // Mock upload action
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    if (question) {
      question.files.push({ name: `evidence_document_${Date.now().toString().slice(-4)}.pdf`, size: '1.5 MB' });
      question.status = 'uploaded';
      
      // Recalculate overall progress
      if (this.categoryData) {
        const completed = this.categoryData.questions.filter(q => q.status === 'approved' || q.status === 'uploaded').length;
        this.categoryData.progress = Math.round((completed / this.categoryData.questions.length) * 100);
      }
    }
  }

  deleteFile(questionId: string, fileIndex: number) {
    const question = this.categoryData?.questions.find(q => q.id === questionId);
    if (question) {
      question.files.splice(fileIndex, 1);
      if (question.files.length === 0) {
        question.status = 'pending';
      }
      // Recalculate 
      if (this.categoryData) {
        const completed = this.categoryData.questions.filter(q => q.status === 'approved' || q.status === 'uploaded').length;
        this.categoryData.progress = Math.round((completed / this.categoryData.questions.length) * 100);
      }
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

// Ensure the local `names` var works for the fallback
const names = ['', 'การกำหนดนโยบาย การวางแผน', 'การสื่อสารและสร้างจิตสำนึก', 'การใช้ทรัพยากรและพลังงาน', 'การจัดการของเสีย', 'สภาพแวดล้อมและความปลอดภัย', 'การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม'];
