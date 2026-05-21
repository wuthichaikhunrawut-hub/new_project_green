import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadService } from '../../../core/services/upload.service';
import { AuthService } from '../../../core/services/auth.service';
import { GreenOfficeService } from '../../../core/services/green-office.service';

@Component({
  selector: 'app-green-office-evidence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evidence.html',
  styleUrl: './evidence.css'
})
export class GreenOfficeEvidenceComponent implements OnInit {
  private toast = inject(ToastService);

  private uploadService = inject(UploadService);
  private authService = inject(AuthService);
  private greenOfficeService = inject(GreenOfficeService);
  private cdr = inject(ChangeDetectorRef);

  files: any[] = [];

  isDragging = false;
  isUploading = false;
  pendingFile: File | null = null;
  editingFileId: number | null = null; // New: track which file is being edited
  selectedPreviewFile: any = null;
  searchTerm = '';
  selectedCategory = '';
  filterCategory = '';
  hasCategory7 = false;

  ngOnInit() {
    this.loadFiles();
    this.greenOfficeService.getCriteriaList().subscribe({
      next: (criteria) => {
        this.hasCategory7 = criteria.some(c => c.category_number === 7);
        this.cdr.markForCheck();
      },
      error: () => {
        this.hasCategory7 = false;
      }
    });
  }

  loadFiles() {
    this.uploadService.getFiles().subscribe({
      next: (res) => {
        this.files = res.map(f => ({
          id: f.evidence_file_id || f.id,
          name: f.file_name || f.original_name || 'ไฟล์ไม่มีชื่อ',
          size: f.file_size ? (Number(f.file_size) / 1024 / 1024).toFixed(2) + ' MB' : '0 MB',
          uploadDate: f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ไม่ระบุวันที่',
          category: f.category || 'หมวดที่ยังไม่ระบุ',
          status: 'pending',
          url: f.file_url
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Failed to load files:', err);
      }
    });
  }

  get filteredFiles() {
    if (!this.files || this.files.length === 0) return [];
    
    return this.files.filter(f => {
      // If search term is empty, always match name
      const search = this.searchTerm ? this.searchTerm.toLowerCase().trim() : '';
      const nameMatch = !search || (f.name && f.name.toLowerCase().includes(search));
      
      // If category filter is empty, always match category
      const categoryMatch = !this.filterCategory || f.category === this.filterCategory;
      
      return nameMatch && categoryMatch;
    });
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files?.length) {
      this.pendingFile = event.dataTransfer.files[0];
    }
  }
  
  triggerFileInput() {
    document.getElementById('fileInput')?.click();
  }
  
  onFileSelect(event: any) {
    if (event.target.files?.length) {
      this.pendingFile = event.target.files[0];
      // Reset input
      event.target.value = '';
    }
  }

  removePendingFile() {
    this.pendingFile = null;
  }

  confirmUpload() {
    if (!this.pendingFile) return;
    this.handleUpload(this.pendingFile, this.selectedCategory);
  }

  handleUpload(file: File, category?: string) {
    this.isUploading = true;
    const userId = this.authService.getUser()?.id;

    this.uploadService.uploadFile(file, 'evidence', { userId, category }).subscribe({
      next: (res) => {
        this.files.unshift({
          id: res.id,
          name: res.file_name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          uploadDate: new Date(res.uploaded_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
          category: this.selectedCategory || 'หมวดที่ยังไม่ระบุ',
          status: 'pending',
          url: res.file_url
        });
        this.isUploading = false;
        this.pendingFile = null; // Clear after success
        this.cdr.markForCheck(); // Force UI update
        this.toast.success('อัปโหลดไฟล์สำเร็จ!');
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.isUploading = false;
        this.toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }
    });
  }

  deleteFile(id: number, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้ถาวร?')) {
      this.isUploading = true;
      this.cdr.markForCheck();
      
      this.uploadService.deleteFile(id).subscribe({
        next: () => {
          this.files = this.files.filter(f => f.id !== id);
          this.isUploading = false;
          this.cdr.markForCheck(); // Force UI update
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

  openPreview(file: any) {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      this.toast.success('ไม่พบ URL สำหรับเปิดไฟล์นี้ครับ');
    }
  }

  startEdit(file: any) {
    this.editingFileId = file.id;
  }

  cancelEdit() {
    this.editingFileId = null;
  }

  updateCategory(file: any, newCategory: string) {
    if (!newCategory) return;
    this.isUploading = true;
    this.uploadService.updateFileCategory(file.id, newCategory).subscribe({
      next: () => {
        file.category = newCategory;
        this.editingFileId = null;
        this.isUploading = false;
        this.cdr.markForCheck(); // Force UI update
        this.toast.success('อัปเดตหมวดหมู่เรียบร้อยครับ! 😊');
      },
      error: (err) => {
        console.error('Update error:', err);
        this.isUploading = false;
        this.toast.error('เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่');
      }
    });
  }

  closePreview() {
    this.selectedPreviewFile = null;
  }
}
