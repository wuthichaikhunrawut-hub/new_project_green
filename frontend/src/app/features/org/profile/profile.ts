import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-org-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class OrgProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  orgForm!: FormGroup;
  isEditing = false;
  savedData: any;
  orgId: number | null = null;
  isLoading = true;

  ngOnInit() {
    this.orgId = this.authService.getOrganizationId();
    
    this.initForm();
    
    if (this.orgId) {
      this.loadOrgData();
    } else {
      this.isLoading = false;
        this.cdr.markForCheck();
      this.orgForm.disable();
    }
  }

  initForm() {
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
  }

  loadOrgData() {
    this.isLoading = true;
    this.orgService.getOrganization(this.orgId!).subscribe({
      next: (data) => {
        this.savedData = data;
        this.orgForm.patchValue(data);
        this.orgForm.disable();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading org data:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
        alert('???????????????????????????');
      }
    });
  }
  
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.orgForm.enable();
    } else {
      this.orgForm.patchValue(this.savedData);
      this.orgForm.disable();
    }
  }
  
  saveProfile() {
    if (this.orgForm.valid && this.orgId) {
      this.isLoading = true;
      this.orgService.updateOrganization(this.orgId, this.orgForm.value).subscribe({
        next: (updatedData) => {
          this.savedData = updatedData;
          this.orgForm.patchValue(updatedData);
          this.isEditing = false;
          this.orgForm.disable();
          this.isLoading = false;
        this.cdr.markForCheck();
          alert('?????????????????????????');
        },
        error: (err) => {
          console.error('Error updating org:', err);
          this.isLoading = false;
        this.cdr.markForCheck();
          alert('???????????????????????????????');
        }
      });
    } else {
      this.orgForm.markAllAsTouched();
    }
  }

  onLogoUpload() {
    alert('????????????????????????????????????????????');
  }
}
