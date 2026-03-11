import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ListOrdered,
  Play,
  Pause,
  X,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader,
  RefreshCw,
  BarChart3,
} from 'lucide-angular';
import { AgentExecution, ExecutionStatus } from '../../../core/models/agent.model';

interface QueueGroup {
  label: string;
  status: ExecutionStatus | 'active';
  color: string;
  items: AgentExecution[];
}

@Component({
  selector: 'app-agent-queue-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './agent-queue-panel.html',
  styleUrl: './agent-queue-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentQueuePanel {
  @Input() set executions(value: AgentExecution[]) {
    this.executionsSignal.set(value);
  }
  @Output() executionAction = new EventEmitter<{ action: string; executionId: string }>();
  @Output() executionSelect = new EventEmitter<AgentExecution>();

  private executionsSignal = signal<AgentExecution[]>([]);

  // Icons
  listIcon = ListOrdered;
  playIcon = Play;
  pauseIcon = Pause;
  xIcon = X;
  upIcon = ArrowUp;
  downIcon = ArrowDown;
  clockIcon = Clock;
  zapIcon = Zap;
  alertIcon = AlertTriangle;
  checkIcon = CheckCircle;
  loaderIcon = Loader;
  refreshIcon = RefreshCw;
  chartIcon = BarChart3;

  queueGroups = computed<QueueGroup[]>(() => {
    const execs = this.executionsSignal();
    return [
      {
        label: 'Active',
        status: 'active' as const,
        color: 'var(--accent-green)',
        items: execs.filter(e => e.status === 'executing' || e.status === 'planning' || e.status === 'initializing'),
      },
      {
        label: 'Queued',
        status: 'queued' as const,
        color: 'var(--accent-purple)',
        items: execs.filter(e => e.status === 'queued').sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
      },
    ];
  });

  recentCompleted = computed(() => {
    return this.executionsSignal()
      .filter(e => e.status === 'completed' || e.status === 'failed')
      .sort((a, b) => {
        const aTime = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bTime = b.endTime ? new Date(b.endTime).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  });

  totalQueued = computed(() => this.executionsSignal().filter(e => e.status === 'queued').length);
  totalActive = computed(() => this.executionsSignal().filter(e => ['executing', 'planning', 'initializing'].includes(e.status)).length);

  avgWaitTime = computed(() => {
    const queued = this.executionsSignal().filter(e => e.status === 'queued');
    if (queued.length === 0) return '0s';
    const now = Date.now();
    const avg = queued.reduce((acc, e) => acc + (now - new Date(e.startTime).getTime()), 0) / queued.length;
    return avg < 60000 ? `${Math.round(avg / 1000)}s` : `${Math.round(avg / 60000)}m`;
  });

  onAction(action: string, execId: string, event: Event): void {
    event.stopPropagation();
    this.executionAction.emit({ action, executionId: execId });
  }

  onSelect(exec: AgentExecution): void {
    this.executionSelect.emit(exec);
  }

  getStatusIcon(status: ExecutionStatus) {
    switch (status) {
      case 'executing':
      case 'planning':
      case 'initializing':
        return this.loaderIcon;
      case 'queued':
        return this.clockIcon;
      case 'completed':
        return this.checkIcon;
      case 'failed':
        return this.alertIcon;
      default:
        return this.clockIcon;
    }
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      critical: 'var(--accent-red)',
      high: 'var(--accent-orange)',
      normal: 'var(--accent-cyan)',
      low: 'var(--text-muted)',
    };
    return map[priority] || 'var(--text-muted)';
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  getElapsedTime(exec: AgentExecution): string {
    const start = new Date(exec.startTime).getTime();
    const end = exec.endTime ? new Date(exec.endTime).getTime() : Date.now();
    return this.formatDuration(end - start);
  }
}
