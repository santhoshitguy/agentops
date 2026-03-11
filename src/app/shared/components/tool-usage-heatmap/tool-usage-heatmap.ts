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
import { LucideAngularModule, Grid3x3, Clock } from 'lucide-angular';
import { ToolHeatmapCell } from '../../../core/models/agent.model';

@Component({
  selector: 'app-tool-usage-heatmap',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tool-usage-heatmap.html',
  styleUrl: './tool-usage-heatmap.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolUsageHeatmap {
  @Input() set cells(value: ToolHeatmapCell[]) {
    this.cellsSignal.set(value);
  }
  @Input() set toolNames(value: string[]) {
    this.toolNamesSignal.set(value);
  }
  @Output() cellClick = new EventEmitter<ToolHeatmapCell>();

  private cellsSignal = signal<ToolHeatmapCell[]>([]);
  private toolNamesSignal = signal<string[]>([]);
  hoveredCell = signal<ToolHeatmapCell | null>(null);
  metric = signal<'calls' | 'latency' | 'errors'>('calls');

  gridIcon = Grid3x3;
  clockIcon = Clock;

  hours = Array.from({ length: 24 }, (_, i) => i);
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  toolList = computed(() => this.toolNamesSignal());

  maxValue = computed(() => {
    const cells = this.cellsSignal();
    const m = this.metric();
    if (cells.length === 0) return 1;
    const values = cells.map(c =>
      m === 'calls' ? c.callCount : m === 'latency' ? c.avgLatency : c.errorRate
    );
    return Math.max(...values, 1);
  });

  // Build a grid: rows=tools, cols=hours (aggregated across days for a compact view)
  heatmapRows = computed(() => {
    const cells = this.cellsSignal();
    const tools = this.toolNamesSignal();
    const m = this.metric();

    return tools.map(toolName => {
      const toolCells = cells.filter(c => c.toolId === toolName);
      const hourData = this.hours.map(hour => {
        const matching = toolCells.filter(c => c.hour === hour);
        if (matching.length === 0) return { hour, value: 0, count: 0, latency: 0, errorRate: 0 };
        const totalCalls = matching.reduce((a, c) => a + c.callCount, 0);
        const avgLat = matching.reduce((a, c) => a + c.avgLatency, 0) / matching.length;
        const avgErr = matching.reduce((a, c) => a + c.errorRate, 0) / matching.length;
        const value = m === 'calls' ? totalCalls : m === 'latency' ? avgLat : avgErr;
        return { hour, value, count: totalCalls, latency: Math.round(avgLat), errorRate: avgErr };
      });
      return { toolName, hourData };
    });
  });

  getCellIntensity(value: number): number {
    const max = this.maxValue();
    if (max === 0) return 0;
    return Math.min(1, value / max);
  }

  getCellColor(value: number): string {
    const intensity = this.getCellIntensity(value);
    const m = this.metric();
    if (intensity === 0) return 'var(--bg-deep)';
    const alpha = 0.15 + intensity * 0.85;
    if (m === 'calls') return `rgba(0, 229, 255, ${alpha})`;
    if (m === 'latency') return `rgba(255, 145, 0, ${alpha})`;
    return `rgba(255, 82, 82, ${alpha})`;
  }

  setMetric(m: 'calls' | 'latency' | 'errors'): void {
    this.metric.set(m);
  }

  onCellHover(cell: ToolHeatmapCell | null): void {
    this.hoveredCell.set(cell);
  }

  formatHour(h: number): string {
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h < 12 ? `${h}a` : `${h - 12}p`;
  }
}
