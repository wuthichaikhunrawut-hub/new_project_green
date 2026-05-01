import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styles: ``
})
export class AdminSettingsComponent {
  settings = {
    defaultBaseYear: 2024,
    systemName: 'GREEN SYNC',
    maintenanceMode: false,
    carbonStandard: 'TGO',
    carbonThreshold: 50000
  };

  saveSettings() {
    alert('บันทึกการตั้งค่าสำเร็จ! (Mock)');
  }
}
