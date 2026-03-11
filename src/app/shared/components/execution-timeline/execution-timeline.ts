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
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  ChevronDown,
  ChevronRight,
  Zap,
  Search,
  Database,
  Code,
  FileText,
  Brain,
  Globe,
  ArrowRight,
} from 'lucide-angular';
import { AgentExecution, AgentStep, ExecutionStatus, StepPhase } from '../../../core/models/agent.model';

@Component({
  selector: 'app-execution-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './execution-timeline.html',
  styleUrl: './execution-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionTimeline {
  @Input() set executions(value: AgentExecution[]) {
    this.executionsSignal.set(value);
  }
  @Output() executionSelect = new EventEmitter<AgentExecution>();
  @Output() stepSelect = new EventEmitter<{ execution: AgentExecution; step: AgentStep }>();

  private executionsSignal = signal<AgentExecution[]>([]);
  expandedExecutions = signal<Set<string>>(new Set());
  selectedExecutionId = signal<string | null>(null);
  filterStatus = signal<ExecutionStatus | 'all'>('all');

  // Icons
  playIcon = Play;
  checkIcon = CheckCircle;
  xIcon = XCircle;
  clockIcon = Clock;
  loaderIcon = Loader;
  chevronDownIcon = ChevronDown;
  chevronRightIcon = ChevronRight;
  zapIcon = Zap;
  searchIcon = Search;
  databaseIcon = Database;
  codeIcon = Code;
  fileIcon = FileText;
  brainIcon = Brain;
  globeIcon = Globe;
  arrowIcon = ArrowRight;

  filteredExecutions = computed(() => {
    const execs = this.executionsSignal();
    const filter = this.filterStatus();
    if (filter === 'all') return execs;
    return execs.filter(e => e.status === filter);
  });

  runningCount = computed(() => this.executionsSignal().filter(e => e.status === 'executing' || e.status === 'planning' || e.status === 'initializing').length);
  completedCount = computed(() => this.executionsSignal().filter(e => e.status === 'completed').length);
  failedCount = computed(() => this.executionsSignal().filter(e => e.status === 'failed').length);
  queuedCount = computed(() => this.executionsSignal().filter(e => e.status === 'queued').length);

  toggleExpand(executionId: string): void {
    this.expandedExecutions.update(set => {
      const next = new Set(set);
      if (next.has(executionId)) {
        next.delete(executionId);
      } else {
        next.add(executionId);
      }
      return next;
    });
  }

  isExpanded(executionId: string): boolean {
    return this.expandedExecutions().has(executionId);
  }

  selectExecution(exec: AgentExecution): void {
    this.selectedExecutionId.set(exec.id);
    this.executionSelect.emit(exec);
  }

  onStepClick(exec: AgentExecution, step: AgentStep): void {
    this.stepSelect.emit({ execution: exec, step });
  }

  setFilter(status: ExecutionStatus | 'all'): void {
    this.filterStatus.set(status);
  }

  getStatusColor(status: ExecutionStatus): string {
    const map: Record<ExecutionStatus, string> = {
      queued: 'var(--accent-purple)',
      initializing: 'var(--accent-lightblue)',
      planning: 'var(--accent-cyan)',
      executing: 'var(--accent-green)',
      completed: 'var(--accent-green)',
      failed: 'var(--accent-red)',
      cancelled: 'var(--text-muted)',
    };
    return map[status];
  }

  getStatusLabel(status: ExecutionStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getPhaseColor(phase: StepPhase): string {
    const map: Record<StepPhase, string> = {
      init: 'var(--accent-lightblue)',
      plan: 'var(--accent-cyan)',
      execute: 'var(--accent-green)',
      respond: 'var(--accent-purple)',
    };
    return map[phase];
  }

  getPhaseLabel(phase: StepPhase): string {
    const map: Record<StepPhase, string> = {
      init: 'Initialize',
      plan: 'Planning',
      execute: 'Execute',
      respond: 'Respond',
    };
    return map[phase];
  }

  getPhaseIcon(phase: StepPhase) {
    const map: Record<StepPhase, typeof Play> = {
      init: Zap,
      plan: Brain,
      execute: Code,
      respond: FileText,
    };
    return map[phase];
  }

  getActionIcon(action: string) {
    if (action.includes('search') || action.includes('query')) return Search;
    if (action.includes('database') || action.includes('db')) return Database;
    if (action.includes('code') || action.includes('compile')) return Code;
    if (action.includes('api') || action.includes('http')) return Globe;
    if (action.includes('write') || action.includes('generate')) return FileText;
    return ArrowRight;
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getElapsedTime(exec: AgentExecution): string {
    const start = new Date(exec.startTime).getTime();
    const end = exec.endTime ? new Date(exec.endTime).getTime() : Date.now();
    return this.formatDuration(end - start);
  }

  getProgressWidth(exec: AgentExecution): number {
    return Math.min(100, Math.max(0, exec.progress));
  }

  getTokenPercent(exec: AgentExecution): number {
    if (!exec.maxTokens) return 0;
    return Math.round((exec.tokensUsed / exec.maxTokens) * 100);
  }
}
