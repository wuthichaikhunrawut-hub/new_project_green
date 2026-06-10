import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalSetting } from './goal-setting';

describe('GoalSetting', () => {
  let component: GoalSetting;
  let fixture: ComponentFixture<GoalSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalSetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalSetting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
