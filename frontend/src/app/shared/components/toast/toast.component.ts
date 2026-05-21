import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  animations: [
    trigger('toastAnimation', [
      state('void', style({
        transform: 'translateY(-10px) translateX(100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateY(0) translateX(0)',
        opacity: 1
      })),
      transition('void => *', animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)')),
      transition('* => void', animate('250ms ease-out', style({
        transform: 'translateX(100%)',
        opacity: 0
      })))
    ])
  ]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(public toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  remove(id: string) {
    this.toastService.remove(id);
  }
}
