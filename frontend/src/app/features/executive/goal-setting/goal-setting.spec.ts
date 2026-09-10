import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GoalSetting } from './goal-setting';
import { ExecutiveService } from '../../../core/services/executive.service';
import { ToastService } from '../../../core/services/toast.service';

describe('GoalSetting', () => {
  let component: GoalSetting;
  let fixture: ComponentFixture<GoalSetting>;
  const executiveService = {
    getDashboard: vi.fn(() =>
      of({
        orgName: 'Test Organization',
        targetReductionPercent: 40,
        netZeroProgressPercent: 25,
      }),
    ),
    setGoal: vi.fn(() => of({ success: true })),
  };
  const toastService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    executiveService.getDashboard.mockClear();
    executiveService.setGoal.mockClear();
    toastService.success.mockClear();
    toastService.error.mockClear();

    await TestBed.configureTestingModule({
      imports: [GoalSetting],
      providers: [
        { provide: ExecutiveService, useValue: executiveService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GoalSetting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(executiveService.getDashboard).toHaveBeenCalledOnce();
    expect(component.orgName).toBe('Test Organization');
    expect(component.goals).toHaveLength(1);
  });
});
