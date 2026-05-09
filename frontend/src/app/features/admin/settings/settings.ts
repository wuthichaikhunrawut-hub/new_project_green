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
  styles: ``
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  settings = {
    defaultBaseYear: 2024,
    systemName: 'GREEN SYNC',
    maintenanceMode: false,
    carbonStandard: 'TGO',
    carbonThreshold: 50000
  };

  isLoading = true;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        if (data) {
          this.settings = { ...this.settings, ...data };
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
        alert('บันทึกการตั้งค่าสำเร็จ!');
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }
}
