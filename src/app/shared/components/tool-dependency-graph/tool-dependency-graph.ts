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
  Network,
  Database,
  Globe,
  Cpu,
  Mail,
  HardDrive,
  BarChart3,
} from 'lucide-angular';
import { ToolUsage, ToolDependencyLink, ToolDefinition } from '../../../core/models/agent.model';

interface GraphNode {
  id: string;
  name: string;
  category: ToolDefinition['category'];
  x: number;
  y: number;
  callCount: number;
  successRate: number;
  avgLatency: number;
  radius: number;
}

interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  coOccurrence: number;
  path: string;
}

@Component({
  selector: 'app-tool-dependency-graph',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tool-dependency-graph.html',
  styleUrl: './tool-dependency-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolDependencyGraph {
  @Input() set tools(value: ToolUsage[]) {
    this.toolsSignal.set(value);
  }
  @Input() set links(value: ToolDependencyLink[]) {
    this.linksSignal.set(value);
  }
  @Input() width = 600;
  @Input() height = 400;
  @Output() nodeClick = new EventEmitter<ToolUsage>();

  private toolsSignal = signal<ToolUsage[]>([]);
  private linksSignal = signal<ToolDependencyLink[]>([]);
  hoveredNode = signal<GraphNode | null>(null);

  networkIcon = Network;

  graphNodes = computed<GraphNode[]>(() => {
    const tools = this.toolsSignal();
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxCalls = Math.max(...tools.map(t => t.callCount), 1);

    return tools.map((tool, i) => {
      const angle = (i / tools.length) * 2 * Math.PI - Math.PI / 2;
      const ringRadius = Math.min(w, h) * 0.32;
      const x = cx + ringRadius * Math.cos(angle);
      const y = cy + ringRadius * Math.sin(angle);
      const radius = 18 + (tool.callCount / maxCalls) * 18;

      return {
        id: tool.toolId,
        name: tool.toolName,
        category: tool.category,
        x,
        y,
        callCount: tool.callCount,
        successRate: tool.successRate,
        avgLatency: tool.averageLatency,
        radius,
      };
    });
  });

  graphEdges = computed<GraphEdge[]>(() => {
    const nodes = this.graphNodes();
    const links = this.linksSignal();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    return links
      .map(link => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return null;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const cpx = (source.x + target.x) / 2 + dy * 0.15;
        const cpy = (source.y + target.y) / 2 - dx * 0.15;
        const path = `M ${source.x} ${source.y} Q ${cpx} ${cpy} ${target.x} ${target.y}`;

        return { source, target, coOccurrence: link.coOccurrence, path };
      })
      .filter((e): e is GraphEdge => e !== null);
  });

  maxCoOccurrence = computed(() => {
    const edges = this.graphEdges();
    return Math.max(...edges.map(e => e.coOccurrence), 1);
  });

  viewBox = computed(() => `0 0 ${this.width} ${this.height}`);

  getCategoryColor(category: ToolDefinition['category']): string {
    const map: Record<string, string> = {
      data: 'var(--accent-cyan)',
      api: 'var(--accent-green)',
      compute: 'var(--accent-purple)',
      communication: 'var(--accent-pink)',
      storage: 'var(--accent-orange)',
      analysis: 'var(--accent-lightblue)',
    };
    return map[category] || 'var(--text-muted)';
  }

  getCategoryIcon(category: ToolDefinition['category']) {
    const map: Record<string, typeof Database> = {
      data: Database,
      api: Globe,
      compute: Cpu,
      communication: Mail,
      storage: HardDrive,
      analysis: BarChart3,
    };
    return map[category] || Database;
  }

  getEdgeOpacity(coOccurrence: number): number {
    return 0.15 + (coOccurrence / this.maxCoOccurrence()) * 0.7;
  }

  getEdgeWidth(coOccurrence: number): number {
    return 1 + (coOccurrence / this.maxCoOccurrence()) * 3;
  }

  getNodeGlowFilter(category: ToolDefinition['category']): string {
    return `glow-${category}`;
  }

  getSuccessRingOffset(node: GraphNode): number {
    const circumference = 2 * Math.PI * (node.radius + 4);
    return circumference - (node.successRate / 100) * circumference;
  }

  getSuccessRingCircumference(node: GraphNode): number {
    return 2 * Math.PI * (node.radius + 4);
  }

  onNodeHover(node: GraphNode | null): void {
    this.hoveredNode.set(node);
  }

  formatLatency(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}
