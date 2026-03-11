import { Injectable, signal, computed } from '@angular/core';
import {
  Agent,
  AgentExecution,
  TaskFlow,
  ToolUsage,
  ExecutionStats,
  CostMetrics,
  NetworkNode,
  NetworkConnection,
  SystemMetrics
} from '../models/agent.model';

@Injectable({
  providedIn: 'root',
})
export class AgentStore {
  // ============================================
  // Private State (The Source)
  // ============================================
  private _agents = signal<Agent[]>([]);
  private _executions = signal<AgentExecution[]>([]);
  private _flows = signal<TaskFlow[]>([]);
  private _tools = signal<ToolUsage[]>([]);
  private _nodes = signal<NetworkNode[]>([]);
  private _connections = signal<NetworkConnection[]>([]);
  private _metrics = signal<SystemMetrics>({
    tokenCount: 0,
    maxTokens: 1000000,
    totalCost: 0,
    contextUsed: 0,
    contextTotal: 200000
  });
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // ============================================
  // Public Read-only Signals (The View)
  // ============================================
  readonly agents = this._agents.asReadonly();
  readonly executions = this._executions.asReadonly();
  readonly flows = this._flows.asReadonly();
  readonly tools = this._tools.asReadonly();
  readonly nodes = this._nodes.asReadonly();
  readonly connections = this._connections.asReadonly();
  readonly metrics = this._metrics.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // ============================================
  // Computed Derived State
  // ============================================
  readonly activeAgents = computed(() =>
    this._agents().filter(a => a.status === 'active' || a.status === 'processing')
  );

  readonly idleAgents = computed(() =>
    this._agents().filter(a => a.status === 'idle')
  );

  readonly failedAgents = computed(() =>
    this._agents().filter(a => a.status === 'error')
  );

  readonly agentCount = computed(() => this._agents().length);
  readonly activeCount = computed(() => this.activeAgents().length);

  readonly totalTokensUsed = computed(() =>
    this._agents().reduce((sum, a) => sum + a.tokensUsed, 0)
  );

  readonly totalCost = computed(() =>
    this._executions().reduce((sum, e) => sum + e.cost, 0)
  );

  readonly executionStats = computed<ExecutionStats>(() => {
    const execs = this._executions();
    const completed = execs.filter(e => e.status === 'completed');
    const failed = execs.filter(e => e.status === 'failed');
    const running = execs.filter(e => e.status === 'executing' || e.status === 'planning' || e.status === 'initializing');
    const queued = execs.filter(e => e.status === 'queued');

    return {
      totalExecutions: execs.length,
      running: running.length,
      queued: queued.length,
      completed: completed.length,
      failed: failed.length,
      avgDuration: completed.length > 0
        ? completed.reduce((sum, e) => sum + ((e.endTime?.getTime() ?? 0) - e.startTime.getTime()), 0) / completed.length
        : 0,
      successRate: (completed.length + failed.length) > 0
        ? (completed.length / (completed.length + failed.length)) * 100
        : 0,
      totalTokensUsed: execs.reduce((sum, e) => sum + e.tokensUsed, 0),
      totalCost: execs.reduce((sum, e) => sum + e.cost, 0),
      throughput: running.length + Math.random() * 2,
    };
  });

  readonly errorRate = computed(() => {
    const execs = this._executions();
    const finished = execs.filter(e => e.status === 'completed' || e.status === 'failed');
    if (finished.length === 0) return 0;
    return (finished.filter(e => e.status === 'failed').length / finished.length) * 100;
  });

  // ============================================
  // Mutations
  // ============================================

  // Agent mutations
  setAgents(agents: Agent[]): void {
    this._agents.set(agents);
  }

  addAgent(agent: Agent): void {
    this._agents.update(agents => [...agents, agent]);
  }

  updateAgent(id: string, updates: Partial<Agent>): void {
    this._agents.update(agents =>
      agents.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  }

  removeAgent(id: string): void {
    this._agents.update(agents => agents.filter(a => a.id !== id));
  }

  // Execution mutations
  setExecutions(executions: AgentExecution[]): void {
    this._executions.set(executions);
  }

  addExecution(execution: AgentExecution): void {
    this._executions.update(execs => [...execs, execution]);
  }

  updateExecution(id: string, updates: Partial<AgentExecution>): void {
    this._executions.update(execs =>
      execs.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }

  removeExecution(id: string): void {
    this._executions.update(execs => execs.filter(e => e.id !== id));
  }

  // Flow mutations
  setFlows(flows: TaskFlow[]): void {
    this._flows.set(flows);
  }

  addFlow(flow: TaskFlow): void {
    this._flows.update(flows => [...flows, flow]);
  }

  updateFlow(id: string, updates: Partial<TaskFlow>): void {
    this._flows.update(flows =>
      flows.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  }

  // Tool mutations
  setTools(tools: ToolUsage[]): void {
    this._tools.set(tools);
  }

  updateTool(toolId: string, updates: Partial<ToolUsage>): void {
    this._tools.update(tools =>
      tools.map(t => t.toolId === toolId ? { ...t, ...updates } : t)
    );
  }

  // Network mutations
  setNodes(nodes: NetworkNode[]): void {
    this._nodes.set(nodes);
  }

  updateNode(id: string, updates: Partial<NetworkNode>): void {
    this._nodes.update(nodes =>
      nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  }

  setConnections(connections: NetworkConnection[]): void {
    this._connections.set(connections);
  }

  updateConnection(id: string, updates: Partial<NetworkConnection>): void {
    this._connections.update(conns =>
      conns.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  // Metrics mutations
  setMetrics(metrics: SystemMetrics): void {
    this._metrics.set(metrics);
  }

  updateMetrics(updates: Partial<SystemMetrics>): void {
    this._metrics.update(m => ({ ...m, ...updates }));
  }

  // Loading & Error state
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  // Reset
  reset(): void {
    this._agents.set([]);
    this._executions.set([]);
    this._flows.set([]);
    this._tools.set([]);
    this._nodes.set([]);
    this._connections.set([]);
    this._metrics.set({
      tokenCount: 0,
      maxTokens: 1000000,
      totalCost: 0,
      contextUsed: 0,
      contextTotal: 200000
    });
    this._loading.set(false);
    this._error.set(null);
  }
}
