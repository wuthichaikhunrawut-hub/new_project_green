import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AssessorsAdminService } from '../../../core/services/assessors-admin.service';
import { RequestsService } from '../../../core/services/requests.service';
import { ToastService } from '../../../core/services/toast.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  const dashboardStats = {
    totalAssessors: 0,
    assigned: 0,
    unassigned: 0,
    inReview: 0,
    completed: 0,
    approved: 0,
    globalApprovalRate: 0,
    recentAssignments: 0,
  };
  const adminService = {
    getDashboardStats: vi.fn(() => of(dashboardStats)),
    getAssessors: vi.fn(() => of([])),
    assignAssessor: vi.fn(() => of({ success: true })),
    processPayout: vi.fn(() => of({ success: true })),
  };
  const requestsService = {
    getRequests: vi.fn(() => of([])),
  };
  const toastService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    adminService.getDashboardStats.mockClear();
    adminService.getAssessors.mockClear();
    requestsService.getRequests.mockClear();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AssessorsAdminService, useValue: adminService },
        { provide: RequestsService, useValue: requestsService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(adminService.getDashboardStats).toHaveBeenCalledOnce();
    expect(requestsService.getRequests).toHaveBeenCalledOnce();
    expect(adminService.getAssessors).toHaveBeenCalledOnce();
    expect(component.isLoading).toBe(false);
  });
});
