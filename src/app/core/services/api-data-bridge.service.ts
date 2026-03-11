/**
 * api-data-bridge.service.ts
 *
 * Bridges REST API (or SeedDataService in mock mode) → AgentStore signal collections.
 *
 * Mock mode  : reads SeedDataService synchronously (no HTTP).
 * Live mode  : fires parallel forkJoin of 6 GET endpoints; each endpoint falls back
 *              to seed data on error so forkJoin never rejects.
 *
 * Mode-change reactivity (effect in constructor):
 *   mock → live  : stopPolling() → loadLiveData()
 *   live → mock  : stopPolling() → loadMockData()
 *
 * Entry point: loadAll() — called once by AgentStateService.initialize()
 */

import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import { Observable, Subscription, forkJoin, interval, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AgentStore } from '../store/agent.store';
import { ApiService } from './api.service';
import { DataModeService } from './data-mode.service';
import { SeedDataService } from './seed-data.service';
import {
  Agent,
  AgentExecution,
  AgentType,
  ExecutionStatus,
  NetworkConnection,
  NetworkNode,
  SystemMetrics,
  TaskFlow,
  ToolUsage,
} from '../models/agent.model';

// ── Backend response shapes (snake_case from FastAPI) ────────────────────────

interface BackendAgent {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  model: string;
  tokens_used: number;
  tokens_limit: number;
  cost_per_hour: number;
  success_rate: number;
  avg_response_time: number;
  tasks_completed: number;
  tasks_in_queue: number;
  last_active: string;
  position?: { x: number; y: number };
  connections?: string[];
}

interface BackendExecution {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: string;
  task_id: string;
  task_name: string;
  status: string;
  priority: string;
  start_time: string;
  end_time?: string;
  progress: number;
  steps: [];
  tokens_used: number;
  max_tokens: number;
  cost: number;
  model: string;
  error_message?: string;
  tags?: string[];
}

interface BackendMetrics {
  active_agents: number;
  executions_today: number;
  total_cost_today_usd: number;
  error_rate: number;
  uptime_percent: number;
  requests_per_minute: number;
  avg_response_time_ms: number;
  context_window_avg: number;  // 0–100 %
}

interface BackendNetworkNode {
  id: string;
  name: string;
  node_type: string;
  x: number;
  y: number;
  status: string;
  model?: string;
}

interface BackendNetworkEdge {
  id: string;
  from_node: string;
  to_node: string;
  active: boolean;
}

interface BackendNetworkResponse {
  nodes: BackendNetworkNode[];
  edges: BackendNetworkEdge[];
}

interface BackendFlow {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: string;
  model: string;
  user_prompt: string;
  thoughts: [];
  status: string;
  total_duration: number;
  total_tokens: number;
  total_cost: number;
  start_time: string;
  end_time?: string;
  loop_count: number;
  max_depth: number;
  tools_used: string[];
  tags?: string[];
}

interface BackendTool {
  tool_id: string;
  tool_name: string;
  category: string;
  call_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  average_latency: number;
  p95_latency: number;
  max_latency: number;
  /** Backend may send string[] or Record<string,number> */
  error_types: string[] | Record<string, number>;
  cost_per_call: number;
  total_cost: number;
  last_used: string;
  agent_usage: Record<string, number>;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiDataBridgeService implements OnDestroy {
  private store    = inject(AgentStore);
  private api      = inject(ApiService);
  private dataMode = inject(DataModeService);
  private seedData = inject(SeedDataService);

  /** Guards the constructor effect() from firing on first run. */
  private initialized = false;
  private pollingSub?: Subscription;

  constructor() {
    // Re-runs whenever DataModeService.isMock() changes.
    // Skips the eager first-run (before loadAll() has been called).
    effect(() => {
      const isMock = this.dataMode.isMock();  // register signal dependency
      if (!this.initialized) return;
      this.stopPolling();
      isMock ? this.loadMockData() : this.loadLiveData();
    });
  }

  // ── Public entry points ──────────────────────────────────────────────────

  /**
   * Primary entry point — called once by AgentStateService.initialize().
   * Sets the initialized flag so mode-change effects fire from here on.
   */
  loadAll(): void {
    this.initialized = true;
    this.dataMode.isMock() ? this.loadMockData() : this.loadLiveData();
  }

  /** On-demand agents refresh (mock = seed, live = HTTP). */
  refreshAgents(): void {
    if (this.dataMode.isMock()) {
      this.store.setAgents(this.seedData.getAgents());
    } else {
      this.fetchAgents().subscribe(agents => this.store.setAgents(agents));
    }
  }

  /** On-demand executions refresh (mock = seed, live = HTTP). */
  refreshExecutions(): void {
    if (this.dataMode.isMock()) {
      this.store.setExecutions(this.seedData.getExecutions());
    } else {
      this.fetchExecutions().subscribe(execs => this.store.setExecutions(execs));
    }
  }

  /** On-demand metrics refresh — no-op in mock mode. */
  refreshMetrics(): void {
    if (this.dataMode.isMock()) return;
    this.api
      .get<BackendMetrics>('/api/metrics/realtime')
      .pipe(catchError(() => of(null)))
      .subscribe(raw => {
        if (raw) this.store.setMetrics(this.mapMetrics(raw));
      });
  }

  /**
   * Starts periodic metrics polling (live mode only).
   * Uses switchMap so in-flight requests are cancelled on each tick.
   */
  startPolling(intervalMs = 30_000): void {
    if (this.dataMode.isMock()) return;
    this.stopPolling();
    this.pollingSub = interval(intervalMs)
      .pipe(
        switchMap(() =>
          this.api
            .get<BackendMetrics>('/api/metrics/realtime')
            .pipe(catchError(() => of(null))),
        ),
      )
      .subscribe(raw => {
        if (raw) this.store.setMetrics(this.mapMetrics(raw));
      });
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ── Private load paths ───────────────────────────────────────────────────

  /**
   * Synchronous seed data path — no HTTP, no loading spinner.
   * Only sets agents/executions/flows/tools.
   * nodes/connections are owned by AgentStateService.initializeMockData().
   */
  private loadMockData(): void {
    this.store.setAgents(this.seedData.getAgents());
    this.store.setExecutions(this.seedData.getExecutions());
    this.store.setFlows(this.seedData.getTaskFlows());
    this.store.setTools(this.seedData.getToolUsage());
  }

  /**
   * Parallel HTTP path — each stream falls back to seed data on error
   * so forkJoin never errors out.
   */
  private loadLiveData(): void {
    this.store.setLoading(true);
    this.store.setError(null);

    forkJoin({
      agents:     this.fetchAgents(),
      executions: this.fetchExecutions(),
      metrics:    this.fetchMetrics(),
      network:    this.fetchNetwork(),
      flows:      this.fetchFlows(),
      tools:      this.fetchTools(),
    }).subscribe({
      next: r => {
        this.store.setAgents(r.agents);
        this.store.setExecutions(r.executions);
        this.store.setMetrics(r.metrics);
        this.store.setNodes(r.network.nodes);
        this.store.setConnections(r.network.connections);
        this.store.setFlows(r.flows);
        this.store.setTools(r.tools);
        this.store.setLoading(false);
      },
      // Shouldn't normally reach here — individual fetchX() always catchError → seed
      error: () => {
        this.store.setError('Failed to load live data. Showing cached data.');
        this.store.setLoading(false);
      },
    });
  }

  // ── Individual fetch helpers ─────────────────────────────────────────────

  private fetchAgents(): Observable<Agent[]> {
    return this.api.get<BackendAgent[]>('/api/agents').pipe(
      map(raw => raw.map(a => this.mapAgent(a))),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/agents failed — falling back to seed data', err);
        return of(this.seedData.getAgents());
      }),
    );
  }

  private fetchExecutions(): Observable<AgentExecution[]> {
    return this.api.get<BackendExecution[]>('/api/executions', { limit: 50 }).pipe(
      map(raw => raw.map(e => this.mapExecution(e))),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/executions failed — falling back to seed data', err);
        return of(this.seedData.getExecutions());
      }),
    );
  }

  private fetchMetrics(): Observable<SystemMetrics> {
    return this.api.get<BackendMetrics>('/api/metrics/realtime').pipe(
      map(raw => this.mapMetrics(raw)),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/metrics/realtime failed — using current metrics', err);
        return of(this.store.metrics());
      }),
    );
  }

  private fetchNetwork(): Observable<{ nodes: NetworkNode[]; connections: NetworkConnection[] }> {
    return this.api.get<BackendNetworkResponse>('/api/agents/network').pipe(
      map(raw => ({
        nodes:       (raw.nodes ?? []).map(n => this.mapNetworkNode(n)),
        connections: (raw.edges ?? []).map(e => this.mapNetworkEdge(e)),
      })),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/agents/network failed — falling back to seed data', err);
        return of({
          nodes:       this.seedData.getNetworkNodes(),
          connections: this.seedData.getNetworkConnections(),
        });
      }),
    );
  }

  private fetchFlows(): Observable<TaskFlow[]> {
    return this.api.get<BackendFlow[]>('/api/flows').pipe(
      map(raw => raw.map(f => this.mapFlow(f))),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/flows failed — falling back to seed data', err);
        return of(this.seedData.getTaskFlows());
      }),
    );
  }

  private fetchTools(): Observable<ToolUsage[]> {
    return this.api.get<BackendTool[]>('/api/tools').pipe(
      map(raw => raw.map(t => this.mapTool(t))),
      catchError(err => {
        console.warn('[ApiDataBridge] /api/tools failed — falling back to seed data', err);
        return of(this.seedData.getToolUsage());
      }),
    );
  }

  // ── Mapper functions (snake_case → camelCase) ────────────────────────────

  private mapAgent(raw: BackendAgent): Agent {
    return {
      id:              raw.id,
      name:            raw.name,
      type:            raw.agent_type as AgentType,
      status:          raw.status as Agent['status'],
      model:           raw.model,
      tokensUsed:      raw.tokens_used ?? 0,
      tokensLimit:     raw.tokens_limit ?? 1_000_000,
      costPerHour:     raw.cost_per_hour ?? 0,
      successRate:     raw.success_rate ?? 0,
      avgResponseTime: raw.avg_response_time ?? 0,
      tasksCompleted:  raw.tasks_completed ?? 0,
      tasksInQueue:    raw.tasks_in_queue ?? 0,
      lastActive:      new Date(raw.last_active),
      position:        raw.position,
      connections:     raw.connections,
    };
  }

  private mapExecution(raw: BackendExecution): AgentExecution {
    return {
      id:         raw.id,
      agentId:    raw.agent_id,
      agentName:  raw.agent_name,
      agentType:  raw.agent_type as AgentType,
      taskId:     raw.task_id,
      taskName:   raw.task_name,
      status:     raw.status as ExecutionStatus,
      priority:   raw.priority as AgentExecution['priority'],
      startTime:  new Date(raw.start_time),
      endTime:    raw.end_time ? new Date(raw.end_time) : undefined,
      progress:   raw.progress ?? 0,
      steps:      raw.steps ?? [],
      tokensUsed: raw.tokens_used ?? 0,
      maxTokens:  raw.max_tokens ?? 128_000,
      cost:       raw.cost ?? 0,
      model:      raw.model,
      tags:       raw.tags,
    };
  }

  private mapMetrics(raw: BackendMetrics): SystemMetrics {
    // context_window_avg is 0–100 %; scale to contextTotal (200k tokens default)
    const current = this.store.metrics();
    const contextTotal = current.contextTotal;
    return {
      tokenCount:   raw.requests_per_minute * 1_000,  // approximate token throughput indicator
      maxTokens:    current.maxTokens,
      totalCost:    raw.total_cost_today_usd ?? current.totalCost,
      contextUsed:  Math.round(((raw.context_window_avg ?? 0) / 100) * contextTotal),
      contextTotal,
    };
  }

  private mapNetworkNode(raw: BackendNetworkNode): NetworkNode {
    return {
      id:     raw.id,
      name:   raw.name,
      type:   raw.node_type as NetworkNode['type'],
      x:      raw.x ?? 0,
      y:      raw.y ?? 0,
      status: raw.status as NetworkNode['status'],
      model:  raw.model,
    };
  }

  private mapNetworkEdge(raw: BackendNetworkEdge): NetworkConnection {
    return {
      id:     raw.id,
      from:   raw.from_node,
      to:     raw.to_node,
      active: raw.active ?? false,
    };
  }

  private mapFlow(raw: BackendFlow): TaskFlow {
    return {
      id:            raw.id,
      agentId:       raw.agent_id,
      agentName:     raw.agent_name,
      agentType:     raw.agent_type as AgentType,
      model:         raw.model,
      userPrompt:    raw.user_prompt,
      thoughts:      raw.thoughts ?? [],
      status:        raw.status as TaskFlow['status'],
      totalDuration: raw.total_duration ?? 0,
      totalTokens:   raw.total_tokens ?? 0,
      totalCost:     raw.total_cost ?? 0,
      startTime:     new Date(raw.start_time),
      endTime:       raw.end_time ? new Date(raw.end_time) : undefined,
      loopCount:     raw.loop_count ?? 0,
      maxDepth:      raw.max_depth ?? 0,
      toolsUsed:     raw.tools_used ?? [],
      tags:          raw.tags,
    };
  }

  private mapTool(raw: BackendTool): ToolUsage {
    // Backend may send error_types as string[] or Record<string,number>
    let errorTypes: Record<string, number>;
    if (Array.isArray(raw.error_types)) {
      errorTypes = raw.error_types.reduce<Record<string, number>>(
        (acc, e) => ({ ...acc, [e]: (acc[e] ?? 0) + 1 }),
        {},
      );
    } else {
      errorTypes = raw.error_types ?? {};
    }

    return {
      toolId:         raw.tool_id,
      toolName:       raw.tool_name,
      category:       raw.category as ToolUsage['category'],
      callCount:      raw.call_count ?? 0,
      successCount:   raw.success_count ?? 0,
      failureCount:   raw.failure_count ?? 0,
      successRate:    raw.success_rate ?? 0,
      averageLatency: raw.average_latency ?? 0,
      p95Latency:     raw.p95_latency ?? 0,
      maxLatency:     raw.max_latency ?? 0,
      errorTypes,
      costPerCall:    raw.cost_per_call ?? 0,
      totalCost:      raw.total_cost ?? 0,
      lastUsed:       new Date(raw.last_used),
      agentUsage:     raw.agent_usage ?? {},
    };
  }
}
