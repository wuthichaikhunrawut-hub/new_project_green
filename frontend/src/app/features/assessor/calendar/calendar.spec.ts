import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Calendar } from './calendar';
import { AssessorService } from '../../../core/services/assessor.service';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  const assessorService = {
    getCalendar: vi.fn(() => of([])),
  };

  beforeEach(async () => {
    assessorService.getCalendar.mockClear();

    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [{ provide: AssessorService, useValue: assessorService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(assessorService.getCalendar).toHaveBeenCalledOnce();
    expect(component.isLoading).toBe(false);
  });
});
