import {
  Component,
  Input,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ============================================
// Status Badge Component
// Colored pill/dot with status label
// ============================================

type StatusString =
  | 'active' | 'idle' | 'processing' | 'error' | 'waiting'
  | 'queued' | 'initializing' | 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled'
  | 'pending' | 'skipped' | 'success' | 'info' | 'running';

type BadgeSize = 'sm' | 'md' | 'lg';

type BadgeColor = 'green' | 'cyan' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadge {
  @Input() set status(v: string) { this.statusSignal.set(v as StatusString); }
  @Input() set size(v: BadgeSize) { this.sizeSignal.set(v); }
  @Input() set pulse(v: boolean) { this.pulseSignal.set(v); }
  @Input() set label(v: string) { this.labelOverride.set(v); }

  private statusSignal = signal<StatusString>('idle');
  private sizeSignal = signal<BadgeSize>('md');
  private pulseSignal = signal(false);
  private labelOverride = signal('');

  badgeSize = computed(() => this.sizeSignal());

  displayLabel = computed(() => {
    if (this.labelOverride()) return this.labelOverride();
    const s = this.statusSignal();
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  shouldPulse = computed(() => {
    if (this.pulseSignal()) return true;
    const activeStatuses: StatusString[] = ['active', 'processing', 'executing', 'running', 'initializing', 'planning'];
    return activeStatuses.includes(this.statusSignal());
  });

  badgeColor = computed((): BadgeColor => {
    const colorMap: Record<string, BadgeColor> = {
      active: 'green',
      completed: 'green',
      success: 'green',
      running: 'green',
      processing: 'cyan',
      executing: 'cyan',
      initializing: 'cyan',
      planning: 'cyan',
      idle: 'yellow',
      queued: 'yellow',
      pending: 'yellow',
      waiting: 'yellow',
      error: 'red',
      failed: 'red',
      cancelled: 'red',
      info: 'blue',
      skipped: 'blue'
    };
    return colorMap[this.statusSignal()] || 'gray';
  });

  colorValue = computed(() => {
    const colors: Record<BadgeColor, string> = {
      green: '#10b981',
      cyan: '#00d4ff',
      yellow: '#f59e0b',
      red: '#ef4444',
      blue: '#3b82f6',
      purple: '#a855f7',
      gray: '#6b7280'
    };
    return colors[this.badgeColor()];
  });

  badgeClasses = computed(() => ({
    'status-badge': true,
    [`size-${this.sizeSignal()}`]: true,
    [`color-${this.badgeColor()}`]: true,
    'pulse-active': this.shouldPulse()
  }));
}
