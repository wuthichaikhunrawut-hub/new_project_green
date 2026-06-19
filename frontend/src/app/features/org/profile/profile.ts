import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { OrgBranchesService, OrgBranch } from '../../../core/services/org-branches.service';
import { User } from '../../../core/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-org-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class OrgProfileComponent implements OnInit {
  private toast = inject(ToastService);

  private fb = inject(FormBuilder);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private branchesService = inject(OrgBranchesService);
  private uploadService = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  orgForm!: FormGroup;
  userForm!: FormGroup;
  isEditingOrg = false;
  isEditingUser = false;
  
  savedOrgData: any;
  savedUserData: any;
  
  orgId: number | null = null;
  userId: number | null = null;
  currentUser: User | null = null;
  orgLogoUrl: string | null = null;
  
  branches: OrgBranch[] = [];
  isLoading = true;

  get isOrgAdmin(): boolean {
    return this.currentUser?.role === 'Organization Admin' || this.currentUser?.role === 'ORG_ADMIN' || this.currentUser?.role === 'System Admin' || this.currentUser?.role === 'SYSTEM_ADMIN';
  }

  ngOnInit() {
    this.orgId = this.authService.getOrganizationId();
    this.currentUser = this.authService.getUser();
    this.userId = this.currentUser?.id || null;
    
    if (this.orgId) {
      this.orgLogoUrl = localStorage.getItem('org_logo_' + this.orgId);
    }
    
    this.initForms();
    
    if (this.orgId && this.userId) {
      this.loadAllData();
    } else {
      this.isLoading = false;
      this.orgForm.disable();
      this.userForm.disable();
    }
  }

  initForms() {
    this.orgForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5)]],
      tax_id: ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      industry_type: ['', Validators.required],
      number_of_employees: [0, [Validators.required, Validators.min(0)]],
      total_floor_area: [0, [Validators.required, Validators.min(0)]],
      working_hours_per_year: [0, [Validators.required, Validators.min(0)]],
      base_year: [new Date().getFullYear(), Validators.required],
      target_reduction_percent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      current_green_status: ['none', Validators.required]
    });

    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      org_unit_id: [null]
    });
  }

  loadAllData() {
    this.isLoading = true;
    forkJoin({
      org: this.orgService.getOrganization(this.orgId!),
      user: this.usersService.getUser(this.userId!),
      branches: this.branchesService.getBranches(this.orgId!)
    }).subscribe({
      next: (res) => {
        this.savedOrgData = res.org;
        this.orgForm.patchValue(res.org);
        this.orgForm.disable();

        this.savedUserData = res.user;
        this.userForm.patchValue({
          first_name: res.user.user_profile?.first_name || '',
          last_name: res.user.user_profile?.last_name || '',
          email: res.user.email,
          org_unit_id: res.user.org_unit_id || ''
        });
        this.userForm.disable();

        this.branches = res.branches;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading profile data:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }


  
  toggleEditOrg() {
    this.isEditingOrg = !this.isEditingOrg;
    if (this.isEditingOrg) {
      this.orgForm.enable();
    } else {
      this.orgForm.patchValue(this.savedOrgData);
      this.orgForm.disable();
    }
  }

  toggleEditUser() {
    this.isEditingUser = !this.isEditingUser;
    if (this.isEditingUser) {
      this.userForm.enable();
      this.userForm.get('email')?.disable(); // email cannot be changed here
    } else {
      this.userForm.patchValue({
        first_name: this.savedUserData.user_profile?.first_name || '',
        last_name: this.savedUserData.user_profile?.last_name || '',
        org_unit_id: this.savedUserData.org_unit_id || ''
      });
      this.userForm.disable();
    }
  }
  
  saveOrgProfile() {
    if (this.orgForm.valid && this.orgId) {
      this.isLoading = true;
      this.orgService.updateOrganization(this.orgId, this.orgForm.value).subscribe({
        next: (updatedData) => {
          this.savedOrgData = updatedData;
          this.orgForm.patchValue(updatedData);
          this.isEditingOrg = false;
          this.orgForm.disable();
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.success('บันทึกข้อมูลองค์กรเรียบร้อยแล้ว');
        },
        error: (err) => {
          console.error('Error updating org:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลองค์กร');
        }
      });
    } else {
      this.orgForm.markAllAsTouched();
    }
  }

  saveUserProfile() {
    if (this.userForm.valid && this.userId) {
      this.isLoading = true;
      const val = this.userForm.getRawValue();
      const payload: any = {
        org_unit_id: val.org_unit_id ? Number(val.org_unit_id) : null,
        user_profile: {
          first_name: val.first_name,
          last_name: val.last_name
        }
      };

      this.usersService.updateUser(this.userId, payload).subscribe({
        next: (updatedUser) => {
          this.savedUserData = updatedUser;
          this.isEditingUser = false;
          this.userForm.disable();
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.success('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว');
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  onLogoUpload() {
    document.getElementById('logoInput')?.click();
  }

  onLogoFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.isLoading = true;
      this.cdr.markForCheck();
      
      this.uploadService.uploadFile(file, 'logos', { userId: this.userId || undefined }).subscribe({
        next: (res) => {
          this.orgLogoUrl = res.file_url;
          if (this.orgId) {
            localStorage.setItem('org_logo_' + this.orgId, res.file_url);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.success('อัปโหลดโลโก้องค์กรสำเร็จ!');
        },
        error: (err) => {
          console.error('Logo upload error:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.error('เกิดข้อผิดพลาดในการอัปโหลดโลโก้');
        }
      });
    }
  }
}
