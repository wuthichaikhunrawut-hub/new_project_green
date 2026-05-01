import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent {
  stats = {
    totalOrganizations: 5,
    activeOrganizations: 4,
    totalUsers: 12,
    assessmentRequests: 8,
    carbonReduction: 14500,
    assessorCount: 3,
    subscriptionRevenue: 24000,
    successRate: 85 // Percentage
  };

  // Here we would ideally fetch data from a service
  // constructor(private analyticsService: AnalyticsService) {}
}
