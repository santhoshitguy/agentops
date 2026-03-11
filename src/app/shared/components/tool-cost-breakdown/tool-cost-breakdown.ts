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
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-angular';
import { ToolUsage } from '../../../core/models/agent.model';

interface ToolRow {
  tool: ToolUsage;
  costPercent: number;
  callPercent: number;
  latencyBar: number;
  reliabilityColor: string;
}

@Component({
  selector: 'app-tool-cost-breakdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tool-cost-breakdown.html',
  styleUrl: './tool-cost-breakdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolCostBreakdown {
  @Input() set tools(value: ToolUsage[]) {
    this.toolsSignal.set(value);
  }

  private toolsSignal = signal<ToolUsage[]>([]);
  sortBy = signal<'cost' | 'calls' | 'latency' | 'errors'>('cost');
  expandedTool = signal<string | null>(null);

  dollarIcon = DollarSign;
  trendUpIcon = TrendingUp;
  alertIcon = AlertTriangle;
  arrowUpIcon = ArrowUpRight;
  arrowDownIcon = ArrowDownRight;
  clockIcon = Clock;
  zapIcon = Zap;
  checkIcon = CheckCircle;
  xIcon = XCircle;

  totalCost = computed(() => this.toolsSignal().reduce((a, t) => a + t.totalCost, 0));
  totalCalls = computed(() => this.toolsSignal().reduce((a, t) => a + t.callCount, 0));
  maxLatency = computed(() => Math.max(...this.toolsSignal().map(t => t.averageLatency), 1));

  sortedRows = computed<ToolRow[]>(() => {
    const tools = [...this.toolsSignal()];
    const sort = this.sortBy();
    const tc = this.totalCost();
    const tCalls = this.totalCalls();
    const maxLat = this.maxLatency();

    tools.sort((a, b) => {
      switch (sort) {
        case 'cost': return b.totalCost - a.totalCost;
        case 'calls': return b.callCount - a.callCount;
        case 'latency': return b.averageLatency - a.averageLatency;
        case 'errors': return a.successRate - b.successRate;
      }
    });

    return tools.map(tool => ({
      tool,
      costPercent: tc > 0 ? (tool.totalCost / tc) * 100 : 0,
      callPercent: tCalls > 0 ? (tool.callCount / tCalls) * 100 : 0,
      latencyBar: maxLat > 0 ? (tool.averageLatency / maxLat) * 100 : 0,
      reliabilityColor: tool.successRate >= 99 ? 'var(--accent-green)' :
        tool.successRate >= 95 ? 'var(--accent-cyan)' :
        tool.successRate >= 90 ? 'var(--accent-orange)' : 'var(--accent-red)',
    }));
  });

  topCostTools = computed(() => this.sortedRows().slice(0, 3));

  getCategoryColor(category: string): string {
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

  setSort(sort: 'cost' | 'calls' | 'latency' | 'errors'): void {
    this.sortBy.set(sort);
  }

  toggleExpand(toolId: string): void {
    this.expandedTool.update(current => current === toolId ? null : toolId);
  }

  formatCost(cost: number): string {
    if (cost >= 1) return `$${cost.toFixed(2)}`;
    if (cost >= 0.01) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(4)}`;
  }

  formatLatency(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}
