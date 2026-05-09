import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminAnalyticsService, AdminStats } from '../../../core/services/admin-analytics.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  // Version 2.0 - Forced Recompile
  private analyticsService = inject(AdminAnalyticsService);

  stats: AdminStats = {
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    assessmentRequests: 0,
    carbonReduction: 0,
    assessorCount: 0,
    verifiedAssessors: 0,
    pendingAssessors: 0,
    subscriptionRevenue: 0,
    revenueMonth: 0,
    planDistribution: [],
    assessmentStats: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    },
    storageUsageGb: 0,
    totalFiles: 0,
    successRate: 0
  };

  isLoading = true;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.analyticsService.getAdminDashboardStats().subscribe({
      next: (data: any) => {
        console.log('Admin Stats Data Version:', data.version);
        this.stats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load admin stats:', err);
        this.isLoading = false;
      }
    });
  }
}
