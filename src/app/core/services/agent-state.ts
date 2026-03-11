import { Injectable, signal, computed, inject, OnDestroy, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Agent,
  AgentExecution,
  TaskFlow,
  ToolUsage,
  LogEntry,
  AgentStatus,
  ExecutionStatus,
  ExecutionStats,
  NetworkNode,
  NetworkConnection,
  SystemMetrics,
} from '../models/agent.model';
import { WebSocketService } from './websocket';
import { AgentStore } from '../store/agent.store';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';
import { ApiDataBridgeService } from './api-data-bridge.service';

// ============================================
// State Service - Central reactive state hub
// ============================================

@Injectable({
  providedIn: 'root',
})
export class AgentStateService implements OnDestroy {
  private wsService = inject(WebSocketService);
  private store     = inject(AgentStore);
  private seedData  = inject(SeedDataService);
  private dataMode  = inject(DataModeService);
  private bridge    = inject(ApiDataBridgeService);
  private subscriptions: Subscription[] = [];

  // ============================================
  // Local State (beyond what's in the store)
  // ============================================
  private _logs = signal<LogEntry[]>([]);
  private _selectedAgentId = signal<string | null>(null);
  private _selectedExecutionId = signal<string | null>(null);
  private _initialized = signal(false);

  readonly logs = this._logs.asReadonly();
  readonly selectedAgentId = this._selectedAgentId.asReadonly();
  readonly selectedExecutionId = this._selectedExecutionId.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  // ============================================
  // Delegated Store Reads
  // ============================================
  readonly agents = this.store.agents;
  readonly executions = this.store.executions;
  readonly flows = this.store.flows;
  readonly tools = this.store.tools;
  readonly loading = this.store.loading;
  readonly activeAgents = this.store.activeAgents;
  readonly failedAgents = this.store.failedAgents;
  readonly activeCount = this.store.activeCount;
  readonly agentCount = this.store.agentCount;
  readonly totalCost = this.store.totalCost;
  readonly executionStats = this.store.executionStats;
  readonly errorRate = this.store.errorRate;
  readonly nodes = this.store.nodes;
  readonly connections = this.store.connections;
  readonly metrics = this.store.metrics;

  // ============================================
  // Computed State
  // ============================================
  readonly recentLogs = computed(() => this._logs().slice(-100));

  readonly selectedAgent = computed(() => {
    const id = this._selectedAgentId();
    if (!id) return null;
    return this.store.agents().find(a => a.id === id) ?? null;
  });

  readonly selectedExecution = computed(() => {
    const id = this._selectedExecutionId();
    if (!id) return null;
    return this.store.executions().find(e => e.id === id) ?? null;
  });

  readonly runningExecutions = computed(() =>
    this.store.executions().filter(e =>
      e.status === 'executing' || e.status === 'planning' || e.status === 'initializing'
    )
  );

  readonly queuedExecutions = computed(() =>
    this.store.executions().filter(e => e.status === 'queued')
  );

  readonly completedExecutions = computed(() =>
    this.store.executions().filter(e => e.status === 'completed')
  );

  readonly failedExecutions = computed(() =>
    this.store.executions().filter(e => e.status === 'failed')
  );

  // ============================================
  // Constructor
  // ============================================

  constructor() {
    effect(() => {
      if (this.dataMode.isMock() && this._initialized()) {
        this.resetToMockData();
      }
    });
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the state service and subscribe to WebSocket events
   */
  initialize(): void {
    if (this._initialized()) return;


    // Start mock WebSocket event loop (2s tick drives all mock generators)
    this.wsService.connect({ mockMode: true, mockInterval: 2000 });

    // Subscribe to WebSocket events
    this.subscriptions.push(
      this.wsService.on<Agent>('agent:status').subscribe(agent => {
        this.store.updateAgent(agent.id, agent);
      }),

      this.wsService.on<Agent>('agent:created').subscribe(agent => {
        this.store.addAgent(agent);
      }),

      this.wsService.on<AgentExecution>('execution:update').subscribe(execution => {
        const existing = this.store.executions().find(e => e.id === execution.id);
        if (existing) {
          this.store.updateExecution(execution.id, execution);
        } else {
          this.store.addExecution(execution);
        }
      }),

      this.wsService.on<LogEntry>('log:entry').subscribe(log => {
        // Suppressed per-log console noise — uncomment to trace every log entry:
        // console.debug(`[AgentState] log:entry  level=${log.level}  agent=${log.agentId}`, log.message);
        this.addLog(log);
      }),

      this.wsService.on<TaskFlow>('flow:update').subscribe(flow => {
        const existing = this.store.flows().find(f => f.id === flow.id);
        if (existing) {
          this.store.updateFlow(flow.id, flow);
        } else {
          this.store.addFlow(flow);
        }
      }),

      this.wsService.on<ToolUsage>('tool:update').subscribe(tool => {
        this.store.updateTool(tool.toolId, tool);
      }),
    );

    this._initialized.set(true);

    // Load agents/executions/flows/tools/metrics from SeedData (mock) or FastAPI (live)
    this.bridge.loadAll();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    if (!this.dataMode.isMock()) return;  // skip mock simulation entirely in live mode
    if (this.store.nodes().length > 0) return;
    this.store.setNodes(this.seedData.getNetworkNodes());
    this.store.setConnections(this.seedData.getNetworkConnections());
    this.setLogs(this.seedData.getLogs());
    this.startSimulation();
  }

  private resetToMockData(): void {
    this.store.setNodes(this.seedData.getNetworkNodes());
    this.store.setConnections(this.seedData.getNetworkConnections());
    this.setLogs(this.seedData.getLogs());
  }

  private startSimulation(): void {
    const logTemplates = [
      { level: 'info' as const, agent: 'ORCHESTR', message: 'Processing agent handoff sequence...' },
      { level: 'success' as const, agent: 'Researcher', message: 'Knowledge base query completed [latency: 142ms]' },
      { level: 'info' as const, agent: 'Scorer', message: 'Confidence score calculated: 0.847' },
      { level: 'warning' as const, agent: 'System', message: 'Token budget approaching threshold (82%)' },
      { level: 'debug' as const, agent: 'UCLAM', message: 'Memory consolidation in progress...' },
      { level: 'info' as const, agent: 'Writer', message: 'Output generation initiated [stream mode]' },
      { level: 'error' as const, agent: 'API', message: 'Rate limit warning: 45/50 requests' },
      { level: 'success' as const, agent: 'ORCHESTR', message: 'Task delegation successful' }
    ];

    setInterval(() => {
      // Log generation
      const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: template.level,
        agentId: template.agent.toLowerCase(),
        agentName: template.agent,
        message: template.message
      };
      this.addLog(newLog);

      // Metrics update simulation
      this.store.updateMetrics({
        tokenCount: this.store.metrics().tokenCount + 150 + Math.floor(Math.random() * 50),
        totalCost: this.store.metrics().totalCost + 0.002
      });

    }, 2500);
  }

  // ============================================
  // Actions
  // ============================================

  // Agent actions
  setAgents(agents: Agent[]): void {
    this.store.setAgents(agents);
  }

  updateAgentStatus(agentId: string, status: AgentStatus): void {
    this.store.updateAgent(agentId, { status });
  }

  // Execution actions
  setExecutions(executions: AgentExecution[]): void {
    this.store.setExecutions(executions);
  }

  addExecution(execution: AgentExecution): void {
    this.store.addExecution(execution);
  }

  updateExecutionStatus(executionId: string, status: ExecutionStatus): void {
    this.store.updateExecution(executionId, { status });
  }

  updateExecutionProgress(executionId: string, progress: number): void {
    this.store.updateExecution(executionId, { progress });
  }

  // Flow actions
  setFlows(flows: TaskFlow[]): void {
    this.store.setFlows(flows);
  }

  addFlow(flow: TaskFlow): void {
    this.store.addFlow(flow);
  }

  // Tool actions
  setTools(tools: ToolUsage[]): void {
    this.store.setTools(tools);
  }

  // Log actions
  addLog(log: LogEntry): void {
    this._logs.update(logs => {
      const updated = [...logs, log];
      // Keep only last 500 logs
      return updated.length > 500 ? updated.slice(-500) : updated;
    });
  }

  setLogs(logs: LogEntry[]): void {
    this._logs.set(logs);
  }

  clearLogs(): void {
    this._logs.set([]);
  }

  // Selection actions
  selectAgent(agentId: string | null): void {
    this._selectedAgentId.set(agentId);
  }

  selectExecution(executionId: string | null): void {
    this._selectedExecutionId.set(executionId);
  }

  // ============================================
  // Cleanup
  // ============================================

  reset(): void {
    this.store.reset();
    this._logs.set([]);
    this._selectedAgentId.set(null);
    this._selectedExecutionId.set(null);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}
