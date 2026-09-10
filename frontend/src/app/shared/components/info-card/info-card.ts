import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-card.html',
  styleUrls: ['./info-card.css'],
})
export class InfoCardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() value?: string | number | null;
  @Input() unit?: string = '';

  // Theme styling (e.g. 'emerald', 'sky', 'amber', 'rose', 'slate')
  @Input() theme: string = 'emerald';
  @Input() iconClass: string = 'fa-solid fa-chart-bar';

  // Trend indicator
  @Input() trendValue?: string;
  @Input() trendLabel?: string;
  @Input() trendType: 'up' | 'down' | 'neutral' = 'neutral';

  // Display style
  @Input() isGlass: boolean = false;

  get cardClasses(): string {
    const classes = ['info-card'];

    if (this.isGlass) {
      classes.push('glass-card');
      classes.push(`bg-${this.theme}-500`);
      classes.push('text-white');
    } else {
      classes.push('solid-card');
    }

    return classes.join(' ');
  }
}
