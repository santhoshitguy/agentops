import {
  Component,
  Input,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

// ============================================
// Circular Gauge Component
// Animated Gauge with Glowing Effects & Ticks
// ============================================

type GaugeColor = 'cyan' | 'purple' | 'pink' | 'green' | 'orange' | 'red' | 'blue';

@Component({
  selector: 'app-circular-gauge',
  imports: [DecimalPipe],
  templateUrl: './circular-gauge.html',
  styleUrl: './circular-gauge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularGauge {
  @Input() set value(v: number) { this.valueSignal.set(v); }
  @Input() set maxValue(v: number) { this.maxValueSignal.set(v); }
  @Input() set gaugeSize(v: number) { this.sizeSignal.set(v); }
  @Input() set color(v: GaugeColor) { this.colorSignal.set(v); }
  @Input() set gaugeLabel(v: string) { this.labelSignal.set(v); }
  @Input() set gaugeUnit(v: string) { this.unitSignal.set(v); }
  @Input() set gaugeSublabel(v: string) { this.sublabelSignal.set(v); }
  @Input() set ticks(v: boolean) { this.showTicksSignal.set(v); }
  @Input() set animated(v: boolean) { this.animatedSignal.set(v); }
  @Input() set thickness(v: number) { this.thicknessSignal.set(v); }

  // Signals
  private valueSignal = signal(0);
  private maxValueSignal = signal(100);
  private sizeSignal = signal(160);
  private colorSignal = signal<GaugeColor>('cyan');
  private labelSignal = signal('');
  private unitSignal = signal('');
  private sublabelSignal = signal('');
  private showTicksSignal = signal(true);
  private animatedSignal = signal(true);
  private thicknessSignal = signal(8);
  private animatedValueSignal = signal(0);

  // Exposed computed signals
  size = computed(() => this.sizeSignal());
  label = computed(() => this.labelSignal());
  unit = computed(() => this.unitSignal());
  sublabel = computed(() => this.sublabelSignal());
  showTicks = computed(() => this.showTicksSignal());
  animatedValue = computed(() => this.animatedValueSignal());

  // SVG calculations
  viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);
  center = computed(() => this.size() / 2);
  strokeWidth = computed(() => this.thicknessSignal());
  radius = computed(() => (this.size() - this.strokeWidth() * 2) / 2 - 10);
  innerRadius = computed(() => this.radius() - this.strokeWidth() - 8);
  circumference = computed(() => 2 * Math.PI * this.radius());

  // Progress calculation (270 degrees = 3/4 of circle)
  private arcLength = 0.75; // 270 degrees
  dashOffset = computed(() => {
    const progress = Math.min(this.valueSignal() / this.maxValueSignal(), 1);
    const totalArc = this.circumference() * this.arcLength;
    const filled = totalArc * progress;
    return this.circumference() - filled;
  });

  trackColor = computed(() => 'var(--bg-overlay)');

  // Unique IDs
  private uniqueId = Math.random().toString(36).substring(2, 9);
  gradientId = computed(() => `gauge-gradient-${this.uniqueId}`);
  glowId = computed(() => `gauge-glow-${this.uniqueId}`);
  shadowId = computed(() => `gauge-shadow-${this.uniqueId}`);

  // Color palette
  colorPalette = computed(() => {
    const palettes: Record<GaugeColor, { primary: string; secondary: string; glow: string }> = {
      cyan: {
        primary: '#00d4ff',
        secondary: '#00a8cc',
        glow: 'rgba(0, 212, 255, 0.6)'
      },
      purple: {
        primary: '#a855f7',
        secondary: '#7c3aed',
        glow: 'rgba(168, 85, 247, 0.6)'
      },
      pink: {
        primary: '#f472b6',
        secondary: '#db2777',
        glow: 'rgba(244, 114, 182, 0.6)'
      },
      green: {
        primary: '#10b981',
        secondary: '#059669',
        glow: 'rgba(16, 185, 129, 0.6)'
      },
      orange: {
        primary: '#f59e0b',
        secondary: '#d97706',
        glow: 'rgba(245, 158, 11, 0.6)'
      },
      red: {
        primary: '#ef4444',
        secondary: '#dc2626',
        glow: 'rgba(239, 68, 68, 0.6)'
      },
      blue: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        glow: 'rgba(59, 130, 246, 0.6)'
      }
    };
    return palettes[this.colorSignal()];
  });

  // Tick marks calculation
  tickMarks = computed(() => {
    const tickCount = 12;
    const startAngle = 135; // Start at bottom-left
    const endAngle = 405; // End at bottom-right (270 degree arc)
    const angleRange = endAngle - startAngle;

    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const angle = startAngle + (angleRange * i) / tickCount;
      return {
        angle: angle * (Math.PI / 180),
        isMajor: i % 3 === 0
      };
    });
  });

  // Tick position calculations
  tickStart(angle: number) {
    const r = this.radius() + 4;
    return {
      x: this.center() + r * Math.cos(angle),
      y: this.center() + r * Math.sin(angle)
    };
  }

  tickEnd(angle: number) {
    const isMajor = this.tickMarks().some(t => Math.abs(t.angle - angle) < 0.01 && t.isMajor);
    const length = isMajor ? 8 : 5;
    const r = this.radius() + 4 + length;
    return {
      x: this.center() + r * Math.cos(angle),
      y: this.center() + r * Math.sin(angle)
    };
  }

  constructor() {
    // Animate value changes
    effect(() => {
      const targetValue = this.valueSignal();
      if (this.animatedSignal()) {
        this.animateValue(targetValue);
      } else {
        this.animatedValueSignal.set(targetValue);
      }
    });
  }

  ngOnInit(): void {
    // Initial animation
    if (this.animatedSignal()) {
      this.animateValue(this.valueSignal());
    }
  }

  private animateValue(target: number): void {
    const start = this.animatedValueSignal();
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;

      this.animatedValueSignal.set(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
