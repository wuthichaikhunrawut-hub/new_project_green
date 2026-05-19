import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './features/dashboard/dashboard';
import { CarbonLogsComponent } from './features/logs/carbon-logs';
import { AiScanComponent } from './features/ai-scan/ai-scan';
import { RegisterComponent } from './features/auth/register/register';
import { AssessorRegisterComponent } from './features/auth/assessor-register/assessor-register';
import { HomeComponent } from './features/home/home';

import { CategoryPageComponent } from './features/assessment/category/category';
import { GreenOfficeFormComponent } from './features/green-office/form/form';
import { GreenOfficeEvidenceComponent } from './features/green-office/evidence/evidence';
import { OrgProfileComponent } from './features/org/profile/profile';
import { SubscriptionComponent } from './features/subscription/subscription';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // 1. หน้าแรกสุด ถ้ายังไม่ login ให้ดีดไปหน้า login
  { path: '', component: HomeComponent, title: 'Green Sync - นวัตกรรมองค์กรสีเขียว' },

  // 2. หน้า Login (ไม่ใช้ Layout หลัก)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, title: 'ลงทะเบียนองค์กร - Green Sync' },
  { path: 'register/assessor', component: AssessorRegisterComponent, title: 'ลงทะเบียนผู้ตรวจประเมิน - Green Sync' },

  // 3. หน้าที่ต้องผ่านการ Login และใช้ Layout ร่วมกัน (Sidebar/Header)
  {
    path: '',
    component: MainLayoutComponent,
    // canActivate: [authGuard], // เดี๋ยวค่อยมาเปิดใช้งานเมื่อทำระบบ Guard เสร็จ
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        title: 'Green Sync - ภาพรวมระบบ',
        canActivate: [RoleGuard],
        data: { roles: ['USER', 'EXECUTIVE', 'EMPLOYEE', 'SYSTEM_ADMIN', 'ORG_ADMIN'] }
      },
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/users').then(m => m.AdminUsersComponent),
        title: 'จัดการผู้ใช้งาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/criteria',
        loadComponent: () => import('./features/admin/criteria/criteria').then(m => m.AdminCriteriaComponent),
        title: 'เกณฑ์ประเมิน Green Office - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/organizations',
        loadComponent: () => import('./features/admin/organizations/organizations').then(m => m.AdminOrganizationsComponent),
        title: 'จัดการองค์กร - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/emission-factors',
        loadComponent: () => import('./features/admin/emission-factors/emission-factors').then(m => m.AdminEmissionFactorsComponent),
        title: 'ค่าสัมประสิทธิ์คาร์บอน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/assessors',
        loadComponent: () => import('./features/admin/assessors/assessors').then(m => m.AdminAssessorsComponent),
        title: 'ยืนยันผู้ตรวจประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./features/admin/settings/settings').then(m => m.AdminSettingsComponent),
        title: 'ตั้งค่าระบบ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/subscriptions',
        loadComponent: () => import('./features/admin/subscriptions/subscriptions').then(m => m.AdminSubscriptionsComponent),
        title: 'จัดการแพ็กเกจ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/invoices',
        loadComponent: () => import('./features/admin/invoices/invoices').then(m => m.AdminInvoicesComponent),
        title: 'ประวัติการชำระเงิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () => import('./features/admin/audit-logs/audit-logs').then(m => m.AdminAuditLogsComponent),
        title: 'ประวัติการทำรายการ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
      },
      {
        path: 'admin/notifications',
        loadComponent: () => import('./features/admin/notifications/notifications-admin.component').then(m => m.NotificationsAdminComponent),
        title: 'ส่งการแจ้งเตือน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN'] }
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
        path: 'assessor/notifications',
        loadComponent: () => import('./features/assessor/notifications/notifications').then(m => m.AssessorNotificationsComponent),
        title: 'การแจ้งเตือน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ASSESSOR'] }
      },

      // GROUP 3: CARBON FOOTPRINT
      {
        path: 'carbon/logs',
        component: CarbonLogsComponent,
        title: 'บันทึกก๊าซเรือนกระจก',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'ai-scan',
        component: AiScanComponent,
        title: 'AI Scan - วิเคราะห์ภาพถ่ายเพื่อลดคาร์บอน',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },

      // GROUP 2: GREEN OFFICE ASSESSMENTS
      {
        path: 'assessment',
        component: GreenOfficeFormComponent,
        title: 'แบบประเมินตนเอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'assessment/category/:id', 
        component: CategoryPageComponent,
        title: 'แบบประเมินตนเอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'green-office/evidence', 
        component: GreenOfficeEvidenceComponent,
        title: 'จัดการไฟล์หลักฐาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },

      // GROUP 1: ORGANIZATION
      { 
        path: 'org/profile', 
        component: OrgProfileComponent,
        title: 'ข้อมูลหน่วยงาน - Green Sync'
        // Every logged-in user can access profile
      },
      {
        path: 'assessor/profile',
        loadComponent: () => import('./features/assessor/profile/profile').then(m => m.AssessorProfileComponent),
        title: 'โปรไฟล์ผู้ตรวจประเมิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'ASSESSOR'] }
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/requests/requests').then(m => m.RequestsComponent),
        title: 'จัดการคำขอรับรอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ASSESSOR', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      {
        path: 'requests/create',
        loadComponent: () => import('./features/requests/create/create-request').then(m => m.CreateRequestComponent),
        title: 'สร้างคำขอรับรอง - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ORGANIZATION_ADMIN'] }
      },
      {
        path: 'requests/evaluate/:id',
        loadComponent: () => import('./features/requests/evaluate/request-evaluate').then(m => m.RequestEvaluateComponent),
        title: 'ตรวจประเมินคำขอ - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'ASSESSOR'] }
      },
      { 
        path: 'subscription', 
        component: SubscriptionComponent,
        title: 'แพ็กเกจการใช้งาน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE', 'EXECUTIVE'] }
      },
      { 
        path: 'subscription/billing', 
        loadComponent: () => import('./features/subscription/billing/billing').then(m => m.BillingComponent),
        title: 'จัดการการชำระเงิน - Green Sync',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'EMPLOYEE'] }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'การแจ้งเตือน - Green Sync'
      },
    ]
  },

  // 4. กรณีพิมพ์ URL มั่ว (Wildcard Route)
  { path: '**', redirectTo: 'login' }
];