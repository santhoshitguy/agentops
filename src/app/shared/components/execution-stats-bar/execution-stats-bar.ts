import {
  Component,
  Input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-angular';
import { ExecutionStats } from '../../../core/models/agent.model';

@Component({
  selector: 'app-execution-stats-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './execution-stats-bar.html',
  styleUrl: './execution-stats-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionStatsBar {
  @Input() set stats(value: ExecutionStats) {
    this.statsSignal.set(value);
  }

  statsSignal = signal<ExecutionStats>({
    totalExecutions: 0,
    running: 0,
    queued: 0,
    completed: 0,
    failed: 0,
    avgDuration: 0,
    successRate: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    throughput: 0,
  });

  // Icons
  activityIcon = Activity;
  clockIcon = Clock;
  checkIcon = CheckCircle;
  xIcon = XCircle;
  zapIcon = Zap;
  dollarIcon = DollarSign;
  upIcon = TrendingUp;
  downIcon = TrendingDown;
  layersIcon = Layers;

  cards = computed(() => {
    const s = this.statsSignal();
    return [
      {
        label: 'Total Executions',
        value: s.totalExecutions.toString(),
        icon: this.layersIcon,
        color: 'var(--accent-cyan)',
        sub: `${s.running} running`,
      },
      {
        label: 'Success Rate',
        value: `${s.successRate.toFixed(1)}%`,
        icon: this.checkIcon,
        color: s.successRate >= 90 ? 'var(--accent-green)' : s.successRate >= 70 ? 'var(--accent-orange)' : 'var(--accent-red)',
        sub: `${s.failed} failed`,
      },
      {
        label: 'Avg Duration',
        value: this.formatDuration(s.avgDuration),
        icon: this.clockIcon,
        color: 'var(--accent-purple)',
        sub: '',
      },
      {
        label: 'Throughput',
        value: `${s.throughput.toFixed(1)}`,
        icon: this.zapIcon,
        color: 'var(--accent-lightblue)',
        sub: 'exec/min',
      },
      {
        label: 'Tokens Used',
        value: this.formatTokens(s.totalTokensUsed),
        icon: this.activityIcon,
        color: 'var(--accent-orange)',
        sub: '',
      },
      {
        label: 'Total Cost',
        value: `$${s.totalCost.toFixed(2)}`,
        icon: this.dollarIcon,
        color: 'var(--accent-yellow)',
        sub: '',
      },
    ];
  });

  successRateArc = computed(() => {
    const rate = this.statsSignal().successRate;
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;
    return { circumference, offset, radius };
  });

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m`;
  }

  private formatTokens(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
}
