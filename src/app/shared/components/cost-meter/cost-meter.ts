import {
  Component,
  Input,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';

// ============================================
// Cost Meter Component
// Horizontal bar gauge: spend vs budget + projection
// ============================================

type MeterZone = 'safe' | 'warning' | 'danger';

@Component({
  selector: 'app-cost-meter',
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './cost-meter.html',
  styleUrl: './cost-meter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostMeter {
  @Input() set current(v: number) { this.currentSignal.set(v); }
  @Input() set budget(v: number) { this.budgetSignal.set(v); }
  @Input() set projected(v: number) { this.projectedSignal.set(v); }
  @Input() set label(v: string) { this.labelSignal.set(v); }

  private currentSignal = signal(0);
  private budgetSignal = signal(100);
  private projectedSignal = signal(0);
  private labelSignal = signal('Cost');

  meterLabel = computed(() => this.labelSignal());
  currentValue = computed(() => this.currentSignal());
  budgetValue = computed(() => this.budgetSignal());
  projectedValue = computed(() => this.projectedSignal());

  percentage = computed(() => {
    const budget = this.budgetSignal();
    if (budget <= 0) return 0;
    return Math.min((this.currentSignal() / budget) * 100, 100);
  });

  projectedPercentage = computed(() => {
    const budget = this.budgetSignal();
    if (budget <= 0) return 0;
    return Math.min((this.projectedSignal() / budget) * 100, 120);
  });

  zone = computed((): MeterZone => {
    const pct = this.percentage();
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'safe';
  });

  zoneColor = computed(() => {
    const colors: Record<MeterZone, string> = {
      safe: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    };
    return colors[this.zone()];
  });

  zoneGlow = computed(() => {
    const glows: Record<MeterZone, string> = {
      safe: 'rgba(16, 185, 129, 0.4)',
      warning: 'rgba(245, 158, 11, 0.4)',
      danger: 'rgba(239, 68, 68, 0.4)'
    };
    return glows[this.zone()];
  });

  budgetMarkerPosition = computed(() => {
    // Budget is always at 100% of the track (since track represents 0 to budget)
    // But if projected exceeds budget, we scale
    const maxVal = Math.max(this.budgetSignal(), this.projectedSignal());
    if (maxVal <= 0) return 100;
    return (this.budgetSignal() / maxVal) * 100;
  });

  projectedMarkerPosition = computed(() => {
    const maxVal = Math.max(this.budgetSignal(), this.projectedSignal());
    if (maxVal <= 0) return 0;
    return Math.min((this.projectedSignal() / maxVal) * 100, 100);
  });

  fillWidth = computed(() => {
    const maxVal = Math.max(this.budgetSignal(), this.projectedSignal());
    if (maxVal <= 0) return 0;
    return Math.min((this.currentSignal() / maxVal) * 100, 100);
  });

  meterClasses = computed(() => ({
    'cost-meter': true,
    [`zone-${this.zone()}`]: true
  }));
}
