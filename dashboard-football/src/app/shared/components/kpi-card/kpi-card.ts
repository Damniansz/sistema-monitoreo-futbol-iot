import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [],
  templateUrl: './kpi-card.html',
})
export class KpiCard {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() unit = '';
  @Input() subtitle = '';
  @Input() theme: 'teal' | 'amber' | 'rose' | 'sky' | 'emerald' = 'teal';
}
