import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { RegisterComponent } from './features/auth/register/register';
import { AssessorRegisterComponent } from './features/auth/assessor-register/assessor-register';
import { HomeComponent } from './features/home/home';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // 1. หน้าแรกสุด ถ้ายังไม่ login ให้ดีดไปหน้า login
  { path: '', component: HomeComponent, title: 'Green Sync - นวัตกรรมองค์กรสีเขียว' },

  // 2. หน้า Login (ไม่ใช้ Layout หลัก)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, title: 'ลงทะเบียนองค์กร - Green Sync' },
  { path: 'register/assessor', component: AssessorRegisterComponent, title: 'ลงทะเบียนผู้ตรวจประเมิน - Green Sync' },
  {
    path: 'assessor/report/:id',
    loadComponent: () => import('./features/assessor/report/report').then(m => m.AssessorReportComponent),
    title: 'รายงานการประเมิน - Green Sync',
    canActivate: [RoleGuard],
    data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
  },

  // 3. หน้าที่ต้องผ่านการ Login และใช้ Layout ร่วมกัน (Sidebar/Header)
  {
    path: '',
    component: MainLayoutComponent,
    // canActivate: [authGuard], // เดี๋ยวค่อยมาเปิดใช้งานเมื่อทำระบบ Guard เสร็จ
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
        title: 'Green Sync - ภาพรวมระบบ',
        canActivate: [RoleGuard],
        data: { roles: ['USER', 'EXECUTIVE', 'EMPLOYEE', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/users').then(m => m.AdminUsersComponent),
        title: 'จัดการผู้ใช้งาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN'] }
      },
      {
        path: 'admin/criteria',
        loadComponent: () => import('./features/admin/criteria/criteria').then(m => m.AdminCriteriaComponent),
        title: 'เกณฑ์ประเมิน Green Office - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/organizations',
        loadComponent: () => import('./features/admin/organizations/organizations').then(m => m.AdminOrganizationsComponent),
        title: 'จัดการองค์กร - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/emission-factors',
        loadComponent: () => import('./features/admin/emission-factors/emission-factors').then(m => m.AdminEmissionFactorsComponent),
        title: 'ค่าสัมประสิทธิ์คาร์บอน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/assessors',
        loadComponent: () => import('./features/admin/assessors/assessors').then(m => m.AdminAssessorsComponent),
        title: 'ยืนยันผู้ตรวจประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./features/admin/settings/settings').then(m => m.AdminSettingsComponent),
        title: 'ตั้งค่าระบบ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/subscriptions',
        loadComponent: () => import('./features/admin/subscriptions/subscriptions').then(m => m.AdminSubscriptionsComponent),
        title: 'จัดการแพ็กเกจ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/invoices',
        loadComponent: () => import('./features/admin/invoices/invoices').then(m => m.AdminInvoicesComponent),
        title: 'ประวัติการชำระเงิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () => import('./features/admin/audit-logs/audit-logs').then(m => m.AdminAuditLogsComponent),
        title: 'ประวัติการทำรายการ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'admin/notifications',
        loadComponent: () => import('./features/admin/notifications/notifications-admin.component').then(m => m.NotificationsAdminComponent),
        title: 'ส่งการแจ้งเตือน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },

      // GROUP: ASSESSOR PAGES
      {
        path: 'assessor/dashboard',
        loadComponent: () => import('./features/assessor/dashboard/dashboard').then(m => m.AssessorDashboardComponent),
        title: 'แดชบอร์ดผู้ตรวจประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'assessor/assignments',
        loadComponent: () => import('./features/assessor/assignments/assignments').then(m => m.AssessorAssignmentsComponent),
        title: 'คำขอรับรองสำนักงานสีเขียว - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'assessor/evidence/:id',
        loadComponent: () => import('./features/assessor/evidence-review/evidence-review').then(m => m.AssessorEvidenceReviewComponent),
        title: 'ตรวจหลักฐาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'assessor/decide/:id',
        loadComponent: () => import('./features/assessor/certification-decision/certification-decision').then(m => m.AssessorCertificationDecisionComponent),
        title: 'สรุปผลการประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'assessor/history',
        loadComponent: () => import('./features/assessor/history/history').then(m => m.AssessorHistoryComponent),
        title: 'ประวัติการประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'org/branches',
        loadComponent: () => import('./features/org-admin/org-branches/org-branches').then(m => m.OrgBranchesComponent),
        title: 'จัดการสาขาและแผนก - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN'] }
      },
      {
        path: 'chatbot',
        loadComponent: () => import('./features/chatbot/chatbot').then(m => m.ChatbotComponent),
        title: 'แชทบอท AI - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'EXECUTIVE', 'EMPLOYEE', 'USER'] }
      },
      {
        path: 'assessor/notifications',
        loadComponent: () => import('./features/assessor/notifications/notifications').then(m => m.AssessorNotificationsComponent),
        title: 'การแจ้งเตือน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },

      // GROUP 3: CARBON FOOTPRINT
      {
        path: 'carbon/logs',
        loadComponent: () => import('./features/logs/carbon-logs').then(m => m.CarbonLogsComponent),
        title: 'บันทึกก๊าซเรือนกระจก',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'ai-scan',
        loadComponent: () => import('./features/ai-scan/ai-scan').then(m => m.AiScanComponent),
        title: 'AI Scan - วิเคราะห์ภาพถ่ายเพื่อลดคาร์บอน',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },

      // GROUP 2: GREEN OFFICE ASSESSMENTS
      {
        path: 'assessment',
        loadComponent: () => import('./features/green-office/form/form').then(m => m.GreenOfficeFormComponent),
        title: 'แบบประเมินตนเอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'assessment/category/:id', 
        loadComponent: () => import('./features/assessment/category/category').then(m => m.CategoryPageComponent),
        title: 'แบบประเมินตนเอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'green-office/evidence', 
        loadComponent: () => import('./features/green-office/evidence/evidence').then(m => m.GreenOfficeEvidenceComponent),
        title: 'จัดการไฟล์หลักฐาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'org-admin/revision-center',
        loadComponent: () => import('./features/org-admin/revision-center/revision-center').then(m => m.OrgAdminRevisionCenterComponent),
        title: 'Revision Center - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ORG_ADMIN', 'ORGANIZATION_ADMIN', 'SYSTEM_ADMIN'] }
      },
      {
        path: 'org-admin/quota-usage',
        loadComponent: () => import('./features/org-admin/quota-usage/quota-usage').then(m => m.QuotaUsageComponent),
        title: 'การใช้งานโควตา - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ORG_ADMIN', 'ORGANIZATION_ADMIN', 'SYSTEM_ADMIN'] }
      },
      {
        path: 'executive/dashboard',
        loadComponent: () => import('./features/executive/dashboard/dashboard').then(m => m.ExecutiveDashboardComponent),
        title: 'Executive Dashboard - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['EXECUTIVE', 'SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN'] }
      },

      // GROUP 1: ORGANIZATION
      { 
        path: 'org/profile', 
        loadComponent: () => import('./features/org/profile/profile').then(m => m.OrgProfileComponent),
        title: 'ข้อมูลหน่วยงาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'org/branches',
        loadComponent: () => import('./features/org-admin/org-branches/org-branches').then(m => m.OrgBranchesComponent),
        title: 'จัดการสาขาและแผนก - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ORG_ADMIN', 'ORGANIZATION_ADMIN', 'SYSTEM_ADMIN'] }
      },
      {
        path: 'assessor/profile',
        loadComponent: () => import('./features/assessor/profile/profile').then(m => m.AssessorProfileComponent),
        title: 'โปรไฟล์ผู้ตรวจประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ASSESSOR', 'SYSTEM_ADMIN'] }
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/requests/requests').then(m => m.RequestsComponent),
        title: 'จัดการคำขอรับรอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ORG_ADMIN', 'ASSESSOR', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'requests/create',
        loadComponent: () => import('./features/requests/create/create-request').then(m => m.CreateRequestComponent),
        title: 'สร้างคำขอรับรอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ORGANIZATION_ADMIN', 'ORG_ADMIN'] }
      },
      {
        path: 'requests/evaluate/:id',
        loadComponent: () => import('./features/requests/evaluate/request-evaluate').then(m => m.RequestEvaluateComponent),
        title: 'ตรวจประเมินคำขอ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ASSESSOR', 'SYSTEM_ADMIN'] }
      },
      { 
        path: 'subscription', 
        loadComponent: () => import('./features/subscription/subscription').then(m => m.SubscriptionComponent),
        title: 'แพ็กเกจการใช้งาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'subscription/billing', 
        loadComponent: () => import('./features/subscription/billing/billing').then(m => m.BillingComponent),
        title: 'จัดการการชำระเงิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE'] }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'การแจ้งเตือน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ORGANIZATION_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE', 'ASSESSOR'] }
      },
    ]
  },

  // 4. กรณีพิมพ์ URL มั่ว (Wildcard Route)
  { path: '**', redirectTo: 'login' }
];