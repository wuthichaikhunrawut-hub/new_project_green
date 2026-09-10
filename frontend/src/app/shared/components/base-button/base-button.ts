import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-base-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './base-button.html',
  styleUrls: ['./base-button.css'],
})
export class BaseButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() color: 'primary' | 'success' | 'danger' | 'secondary' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() iconClass?: string;
  @Input() isFullWidth = false;

  @Output() onClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = ['btn-base'];

    // Size classes
    if (this.size === 'sm') classes.push('btn-sm');
    if (this.size === 'md') classes.push('btn-md');
    if (this.size === 'lg') classes.push('btn-lg');

    // Color classes (Tailwind inspired)
    if (this.color === 'primary') classes.push('btn-primary');
    if (this.color === 'success') classes.push('btn-success');
    if (this.color === 'danger') classes.push('btn-danger');
    if (this.color === 'secondary') classes.push('btn-secondary');
    if (this.color === 'outline') classes.push('btn-outline');

    // Full width
    if (this.isFullWidth) classes.push('w-100');

    // Loading state
    if (this.isLoading) classes.push('is-loading');

    return classes.join(' ');
  }
}
