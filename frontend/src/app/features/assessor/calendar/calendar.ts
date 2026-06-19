import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: any[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit {
  private assessorService = inject(AssessorService);
  private router = inject(Router);

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  currentMonthName = '';

  calendarDays: CalendarDay[] = [];
  events: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    this.assessorService.getCalendar().subscribe({
      next: (data) => {
        this.events = data || [];
        this.generateCalendar();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load calendar events', err);
        this.events = [];
        this.generateCalendar();
        this.isLoading = false;
      }
    });
  }

  generateCalendar() {
    const startOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Day of the week of first day of month (0 = Sunday, 1 = Monday, etc.)
    // We want Mon = 0, Tue = 1, ..., Sun = 6 (since grid header is Mon to Sun)
    let startDayOfWeek = startOfMonth.getDay(); 
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days: CalendarDay[] = [];
    
    // Previous month's overflow days
    const prevMonthEnd = new Date(this.currentYear, this.currentMonth, 0);
    const prevMonthDaysCount = prevMonthEnd.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth - 1, prevMonthDaysCount - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isSameDay(d, new Date()),
        events: this.getEventsForDate(d)
      });
    }
    
    // Current month's days
    const daysInMonth = endOfMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(this.currentYear, this.currentMonth, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: this.isSameDay(d, new Date()),
        events: this.getEventsForDate(d)
      });
    }
    
    // Next month's overflow days to fill grid of 35 or 42
    const totalSlots = days.length > 35 ? 42 : 35;
    const nextMonthDaysCount = totalSlots - days.length;
    for (let i = 1; i <= nextMonthDaysCount; i++) {
      const d = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isSameDay(d, new Date()),
        events: this.getEventsForDate(d)
      });
    }
    
    this.calendarDays = days;
    const dateObj = new Date(this.currentYear, this.currentMonth, 1);
    this.currentMonthName = dateObj.toLocaleString('th-TH', { month: 'long' });
  }

  getEventsForDate(d: Date): any[] {
    return this.events.filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return this.isSameDay(eventDate, d);
    });
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  viewAssessment(id: number) {
    this.router.navigate(['/assessor/evidence', id]);
  }

  getEventStyles(ev: any) {
    if (!ev.isAssigned) {
      return {
        'bg-slate-100': true,
        'text-slate-700': true,
        'hover:bg-slate-200': true,
        'border-l-4': true,
        'border-slate-400': true
      };
    }
    
    switch (String(ev.status).toUpperCase()) {
      case 'PENDING':
      case 'SUBMITTED':
        return {
          'bg-blue-50': true,
          'text-blue-700': true,
          'hover:bg-blue-100': true,
          'border-l-4': true,
          'border-blue-500': true
        };
      case 'IN_REVIEW':
        return {
          'bg-amber-50': true,
          'text-amber-700': true,
          'hover:bg-amber-100': true,
          'border-l-4': true,
          'border-amber-500': true
        };
      case 'REVISION_REQUESTED':
        return {
          'bg-rose-50': true,
          'text-rose-700': true,
          'hover:bg-rose-100': true,
          'border-l-4': true,
          'border-rose-500': true
        };
      case 'APPROVED':
        return {
          'bg-emerald-50': true,
          'text-emerald-700': true,
          'hover:bg-emerald-100': true,
          'border-l-4': true,
          'border-emerald-500': true
        };
      default:
        return {
          'bg-gray-50': true,
          'text-gray-700': true,
          'hover:bg-gray-100': true,
          'border-l-4': true,
          'border-gray-500': true
        };
    }
  }
}
