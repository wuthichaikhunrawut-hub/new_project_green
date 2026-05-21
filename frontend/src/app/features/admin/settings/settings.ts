import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styles: `
    .qr-preview {
      width: 150px;
      height: 150px;
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #f8fafc;
    }
    .qr-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `
})
export class AdminSettingsComponent implements OnInit {
  private toast = inject(ToastService);

  private settingsService = inject(SettingsService);

  settings = {
    defaultBaseYear: 2024,
    systemName: 'GREEN SYNC',
    maintenanceMode: false,
    carbonStandard: 'TGO',
    carbonThreshold: 50000,
    'stripe.public_key': '',
    'stripe.secret_key': '',
    'stripe.webhook_secret': '',
    'stripe.currency': 'thb'
  };

  isLoading = true;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        console.log('Backend Settings Received:', data);
        if (data) {
          // Force update each key to be sure
          Object.keys(data).forEach(key => {
            (this.settings as any)[key] = data[key];
          });
          // Also spread for safety
          this.settings = { ...this.settings, ...data };
          console.log('Current Frontend Settings:', this.settings);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
        this.isLoading = false;
      }
    });
  }

  saveSettings() {
    this.settingsService.updateSettings(this.settings).subscribe({
      next: (data) => {
        this.settings = { ...this.settings, ...data };
        this.toast.success('บันทึกการตั้งค่าสำเร็จ!');
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }

  removeQr() {
    // Deprecated for Stripe
  }
}
