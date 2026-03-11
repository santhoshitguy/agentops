import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThoughtStep, ThoughtType, ThoughtStatus } from '../../../core/models/agent.model';

// ============================================
// Decision Tree Component
// SVG-based vertical tree for agent thought steps
// ============================================

interface NodeLayout {
  step: ThoughtStep;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  statusColor: string;
}

@Component({
  selector: 'app-decision-tree',
  imports: [CommonModule],
  templateUrl: './decision-tree.html',
  styleUrl: './decision-tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DecisionTree {
  @Input() set steps(v: ThoughtStep[]) { this.stepsSignal.set(v); }
  @Input() set highlightedStep(v: number) { this.highlightedSignal.set(v); }
  @Input() set compact(v: boolean) { this.compactSignal.set(v); }

  @Output() stepSelect = new EventEmitter<number>();
  @Output() stepHover = new EventEmitter<number | null>();

  private stepsSignal = signal<ThoughtStep[]>([]);
  private highlightedSignal = signal<number>(-1);
  compactSignal = signal(false);

  hoveredStep = signal<number | null>(null);

  // Layout constants
  private readonly NODE_WIDTH = 240;
  private readonly NODE_HEIGHT_COMPACT = 72;
  private readonly NODE_HEIGHT_FULL = 110;
  private readonly NODE_GAP = 24;
  private readonly PADDING = 32;

  nodeHeight = computed(() =>
    this.compactSignal() ? this.NODE_HEIGHT_COMPACT : this.NODE_HEIGHT_FULL
  );

  // Compute node layouts
  nodes = computed((): NodeLayout[] => {
    const steps = this.stepsSignal();
    const h = this.nodeHeight();
    const centerX = this.NODE_WIDTH / 2 + this.PADDING;

    return steps.map((step, i) => ({
      step,
      x: centerX - this.NODE_WIDTH / 2,
      y: this.PADDING + i * (h + this.NODE_GAP),
      width: this.NODE_WIDTH,
      height: h,
      color: this.typeColor(step.type),
      statusColor: this.statusColor(step.status),
    }));
  });

  // SVG viewBox
  svgWidth = computed(() => this.NODE_WIDTH + this.PADDING * 2);
  svgHeight = computed(() => {
    const count = this.stepsSignal().length;
    if (count === 0) return 100;
    const h = this.nodeHeight();
    return this.PADDING * 2 + count * h + (count - 1) * this.NODE_GAP;
  });

  viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);

  // Connection paths between nodes
  connections = computed(() => {
    const n = this.nodes();
    const paths: { d: string; color: string }[] = [];
    for (let i = 0; i < n.length - 1; i++) {
      const from = n[i];
      const to = n[i + 1];
      const x = from.x + from.width / 2;
      const y1 = from.y + from.height;
      const y2 = to.y;
      const midY = (y1 + y2) / 2;
      paths.push({
        d: `M ${x} ${y1} C ${x} ${midY}, ${x} ${midY}, ${x} ${y2}`,
        color: to.color,
      });
    }
    return paths;
  });

  isHighlighted(stepNumber: number): boolean {
    return this.highlightedSignal() === stepNumber;
  }

  isHovered(stepNumber: number): boolean {
    return this.hoveredStep() === stepNumber;
  }

  onNodeClick(stepNumber: number): void {
    this.stepSelect.emit(stepNumber);
  }

  onNodeEnter(stepNumber: number): void {
    this.hoveredStep.set(stepNumber);
    this.stepHover.emit(stepNumber);
  }

  onNodeLeave(): void {
    this.hoveredStep.set(null);
    this.stepHover.emit(null);
  }

  typeLabel(type: ThoughtType): string {
    const labels: Record<ThoughtType, string> = {
      reasoning: 'Reasoning',
      tool_call: 'Tool Call',
      decision: 'Decision',
      observation: 'Observation',
      final_response: 'Response',
    };
    return labels[type] ?? type;
  }

  typeIcon(type: ThoughtType): string {
    const icons: Record<ThoughtType, string> = {
      reasoning: '\u{1F9E0}',
      tool_call: '\u{1F527}',
      decision: '\u{2696}',
      observation: '\u{1F441}',
      final_response: '\u{2714}',
    };
    return icons[type] ?? '\u{25CF}';
  }

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  formatTokens(tokens: number): string {
    if (tokens < 1000) return `${tokens}`;
    return `${(tokens / 1000).toFixed(1)}K`;
  }

  private typeColor(type: ThoughtType): string {
    const colors: Record<ThoughtType, string> = {
      reasoning: '#00d4ff',
      tool_call: '#a855f7',
      decision: '#f59e0b',
      observation: '#10b981',
      final_response: '#3b82f6',
    };
    return colors[type] ?? '#6b7280';
  }

  private statusColor(status: ThoughtStatus): string {
    const colors: Record<ThoughtStatus, string> = {
      completed: '#10b981',
      failed: '#ef4444',
      active: '#00d4ff',
      pending: '#6b7280',
      skipped: '#6b7280',
    };
    return colors[status] ?? '#6b7280';
  }
}
