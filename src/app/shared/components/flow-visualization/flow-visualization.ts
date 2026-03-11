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
  GitBranch,
  Brain,
  Wrench,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  RotateCcw,
  Zap,
} from 'lucide-angular';
import { TaskFlow, ThoughtStep, ThoughtType, ThoughtStatus } from '../../../core/models/agent.model';

interface FlowNode {
  id: string;
  step: ThoughtStep;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

interface FlowEdge {
  from: FlowNode;
  to: FlowNode;
  path: string;
  active: boolean;
}

@Component({
  selector: 'app-flow-visualization',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './flow-visualization.html',
  styleUrl: './flow-visualization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowVisualization {
  @Input() set flow(value: TaskFlow | null) {
    this.flowSignal.set(value);
  }
  @Input() highlightedStep = signal<number>(-1);
  @Output() stepSelect = new EventEmitter<ThoughtStep>();

  flowSignal = signal<TaskFlow | null>(null);
  hoveredNode = signal<FlowNode | null>(null);

  // Icons
  branchIcon = GitBranch;
  brainIcon = Brain;
  wrenchIcon = Wrench;
  eyeIcon = Eye;
  messageIcon = MessageSquare;
  checkIcon = CheckCircle;
  xIcon = XCircle;
  alertIcon = AlertTriangle;
  loaderIcon = Loader;
  loopIcon = RotateCcw;
  zapIcon = Zap;

  private readonly NODE_W = 200;
  private readonly NODE_H = 72;
  private readonly GAP_X = 60;
  private readonly GAP_Y = 36;
  private readonly PADDING = 40;

  flowNodes = computed<FlowNode[]>(() => {
    const flow = this.flowSignal();
    if (!flow) return [];
    return this.layoutNodes(flow.thoughts);
  });

  flowEdges = computed<FlowEdge[]>(() => {
    const nodes = this.flowNodes();
    const edges: FlowEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];
      const midY = from.y + from.height + this.GAP_Y / 2;
      const path = `M ${from.x + from.width / 2} ${from.y + from.height}
        L ${from.x + from.width / 2} ${midY}
        L ${to.x + to.width / 2} ${midY}
        L ${to.x + to.width / 2} ${to.y}`;
      edges.push({
        from, to, path,
        active: from.step.status === 'completed' || from.step.status === 'active',
      });
    }
    return edges;
  });

  svgWidth = computed(() => {
    const nodes = this.flowNodes();
    if (nodes.length === 0) return 600;
    return Math.max(600, Math.max(...nodes.map(n => n.x + n.width)) + this.PADDING * 2);
  });

  svgHeight = computed(() => {
    const nodes = this.flowNodes();
    if (nodes.length === 0) return 400;
    return Math.max(400, Math.max(...nodes.map(n => n.y + n.height)) + this.PADDING * 2);
  });

  viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);

  private layoutNodes(steps: ThoughtStep[]): FlowNode[] {
    const nodes: FlowNode[] = [];
    const centerX = 300;

    steps.forEach((step, i) => {
      // Slight horizontal offset for branching visual interest
      const offsetX = step.type === 'tool_call' ? 40 : step.type === 'decision' ? -30 : 0;
      nodes.push({
        id: `node-${step.stepNumber}`,
        step,
        x: centerX - this.NODE_W / 2 + offsetX + this.PADDING,
        y: i * (this.NODE_H + this.GAP_Y) + this.PADDING,
        width: this.NODE_W,
        height: this.NODE_H,
        depth: 0,
      });
    });

    return nodes;
  }

  getTypeColor(type: ThoughtType): string {
    const map: Record<ThoughtType, string> = {
      reasoning: 'var(--accent-cyan)',
      tool_call: 'var(--accent-green)',
      decision: 'var(--accent-purple)',
      observation: 'var(--accent-orange)',
      final_response: 'var(--accent-lightblue)',
    };
    return map[type];
  }

  getTypeLabel(type: ThoughtType): string {
    const map: Record<ThoughtType, string> = {
      reasoning: 'Reasoning',
      tool_call: 'Tool Call',
      decision: 'Decision',
      observation: 'Observation',
      final_response: 'Response',
    };
    return map[type];
  }

  getTypeIcon(type: ThoughtType) {
    const map: Record<ThoughtType, typeof Brain> = {
      reasoning: Brain,
      tool_call: Wrench,
      decision: GitBranch,
      observation: Eye,
      final_response: MessageSquare,
    };
    return map[type];
  }

  getStatusIcon(status: ThoughtStatus) {
    const map: Record<ThoughtStatus, typeof CheckCircle> = {
      completed: CheckCircle,
      failed: XCircle,
      active: Loader,
      pending: AlertTriangle,
      skipped: XCircle,
    };
    return map[status];
  }

  getStatusColor(status: ThoughtStatus): string {
    const map: Record<ThoughtStatus, string> = {
      completed: 'var(--accent-green)',
      failed: 'var(--accent-red)',
      active: 'var(--accent-cyan)',
      pending: 'var(--text-muted)',
      skipped: 'var(--text-disabled)',
    };
    return map[status];
  }

  isHighlighted(stepNumber: number): boolean {
    return this.highlightedStep() === stepNumber;
  }

  onNodeClick(node: FlowNode): void {
    this.stepSelect.emit(node.step);
  }

  onNodeHover(node: FlowNode | null): void {
    this.hoveredNode.set(node);
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  truncateText(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
