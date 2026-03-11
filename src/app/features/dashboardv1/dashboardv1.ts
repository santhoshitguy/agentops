import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogEntry, NetworkNode } from '../../core/models/agent.model';
import { AgentStateService } from '../../core/services/agent-state';
import { AgentNetwork, MetricsPanel, TerminalPanel } from '../../shared/components';

@Component({
  selector: 'app-dashboardv1',
  imports: [CommonModule,
    AgentNetwork,
    MetricsPanel,
    TerminalPanel
  ],
  templateUrl: './dashboardv1.html',
  styleUrl: './dashboardv1.scss',
})
export class Dashboardv1 implements OnInit, OnDestroy {
  private state = inject(AgentStateService);
  private timeInterval?: ReturnType<typeof setInterval>;

  // Network signals
  nodes = this.state.nodes;
  connections = this.state.connections;
  networkWidth = signal(600);
  networkHeight = signal(450);

  // Metrics signals - mapped from state metrics
  metrics = this.state.metrics;

  tokenCount = computed(() => this.metrics().tokenCount);
  maxTokens = computed(() => this.metrics().maxTokens);
  totalCost = computed(() => this.metrics().totalCost);
  contextUsed = computed(() => this.metrics().contextUsed);
  contextTotal = computed(() => this.metrics().contextTotal);

  // Terminal signals
  logs = this.state.logs;
  isStreaming = signal(true);
  connectionStatus = signal<'connected' | 'connecting' | 'disconnected'>('connected');

  // Timestamp
  currentTimestamp = signal('');

  ngOnInit(): void {
    this.state.initialize();
    this.startTimestampUpdate();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }



  private startTimestampUpdate(): void {
    const updateTimestamp = () => {
      const now = new Date();
      this.currentTimestamp.set(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}, ${now.toLocaleTimeString('en-US', { hour12: false })}`
      );
    };

    updateTimestamp();
    this.timeInterval = setInterval(updateTimestamp, 1000);
  }

  onNodeClick(node: NetworkNode): void {
  }


}
