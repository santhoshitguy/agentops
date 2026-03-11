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
import { Agent, AgentStatus, AgentType } from '../../../core/models/agent.model';

@Component({
  selector: 'app-agent-node',
  imports: [],
  templateUrl: './agent-node.html',
  styleUrl: './agent-node.scss',
})
export class AgentNode {
  @Input() agent: Agent | null = null;
  @Input() set nodeSize(value: number) { this.sizeSignal.set(value); }
  @Input() set label(value: boolean) { this.showLabelSignal.set(value); }

  @Output() nodeClick = new EventEmitter<Agent>();
  @Output() nodeHover = new EventEmitter<{ agent: Agent; hovered: boolean }>();

  // Signals
  private sizeSignal = signal(100);
  private showLabelSignal = signal(true);
  private hoveredSignal = signal(false);

  // Computed values
  size = computed(() => this.sizeSignal());
  showLabel = computed(() => this.showLabelSignal());
  isHovered = computed(() => this.hoveredSignal());
  center = computed(() => this.size() / 2);
  radius = computed(() => (this.size() - 40) / 2);

  // Unique IDs for SVG elements
  private uniqueId = Math.random().toString(36).substring(2, 9);
  gradientId = computed(() => `node-gradient-${this.uniqueId}`);
  innerGradientId = computed(() => `node-inner-gradient-${this.uniqueId}`);
  glowFilterId = computed(() => `node-glow-${this.uniqueId}`);
  pulseFilterId = computed(() => `node-pulse-${this.uniqueId}`);

  // Progress ring dash array
  progressDashArray = computed(() => {
    const circumference = 2 * Math.PI * (this.radius() + 8);
    return `${circumference * 0.25} ${circumference * 0.75}`;
  });

  // Node class based on state
  nodeClass = computed(() => ({
    'agent-node': true,
    'node-hovered': this.isHovered(),
    [`status-${this.agent?.status}`]: true
  }));

  // Color palette based on agent type
  colors = computed(() => {
    const type = this.agent?.type || 'assistant';
    const colorMap: Record<AgentType, { primary: string; secondary: string; glow: string; border: string; highlight: string }> = {
      orchestrator: {
        primary: '#00d4ff',
        secondary: '#0088aa',
        glow: 'rgba(0, 212, 255, 0.5)',
        border: 'rgba(0, 212, 255, 0.6)',
        highlight: '#40e0ff'
      },
      researcher: {
        primary: '#a855f7',
        secondary: '#7c3aed',
        glow: 'rgba(168, 85, 247, 0.5)',
        border: 'rgba(168, 85, 247, 0.6)',
        highlight: '#c084fc'
      },
      writer: {
        primary: '#f472b6',
        secondary: '#db2777',
        glow: 'rgba(244, 114, 182, 0.5)',
        border: 'rgba(244, 114, 182, 0.6)',
        highlight: '#f9a8d4'
      },
      coder: {
        primary: '#10b981',
        secondary: '#059669',
        glow: 'rgba(16, 185, 129, 0.5)',
        border: 'rgba(16, 185, 129, 0.6)',
        highlight: '#34d399'
      },
      reviewer: {
        primary: '#f59e0b',
        secondary: '#d97706',
        glow: 'rgba(245, 158, 11, 0.5)',
        border: 'rgba(245, 158, 11, 0.6)',
        highlight: '#fbbf24'
      },
      analyst: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        glow: 'rgba(59, 130, 246, 0.5)',
        border: 'rgba(59, 130, 246, 0.6)',
        highlight: '#60a5fa'
      },
      assistant: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        glow: 'rgba(99, 102, 241, 0.5)',
        border: 'rgba(99, 102, 241, 0.6)',
        highlight: '#818cf8'
      }
    };
    return colorMap[type];
  });

  // Status indicator color
  statusColor = computed(() => {
    const statusColors: Record<AgentStatus, string> = {
      active: '#10b981',
      idle: '#f59e0b',
      processing: '#00d4ff',
      error: '#ef4444',
      waiting: '#a855f7'
    };
    return statusColors[this.agent?.status || 'idle'];
  });

  // Icon color (white for contrast)
  iconColor = computed(() => 'rgba(255, 255, 255, 0.9)');

  // Agent type icon paths (24x24 viewBox)
  agentIcon = computed(() => {
    const icons: Record<AgentType, string> = {
      orchestrator: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      researcher: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      writer: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      coder: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      reviewer: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      analyst: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      assistant: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    };
    return icons[this.agent?.type || 'assistant'];
  });

  onHover(hovered: boolean): void {
    this.hoveredSignal.set(hovered);
    if (this.agent) {
      this.nodeHover.emit({ agent: this.agent, hovered });
    }
  }

  onClick(): void {
    if (this.agent) {
      this.nodeClick.emit(this.agent);
    }
  }
}
