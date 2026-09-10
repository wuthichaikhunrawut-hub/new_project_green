import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CarbonEquivalencyService } from '../../../core/services/carbon-equivalency.service';

@Component({
  selector: 'app-impact-equivalency-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impact-equivalency-card.html',
  styleUrls: ['./impact-equivalency-card.css'],
})
export class ImpactEquivalencyCardComponent {
  @Input({ required: true }) reducedTco2e = 0;
  @Input() title = 'Impact Equivalency';
  @Input() subtitle = 'เชื่อมโยงเป้าหมาย Carbon Neutrality (1.6.1)';

  constructor(private carbonEq: CarbonEquivalencyService) {}

  get eq() {
    return this.carbonEq.toEquivalency(this.reducedTco2e);
  }
}
