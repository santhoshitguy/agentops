import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PlaygroundService } from '../../core/services/playground.service';
import { AgentExecutorService } from '../../core/services/agent-executor.service';
import { AgentStore } from '../../core/store/agent.store';
import {
  ModelId,
  AVAILABLE_MODELS,
  PARAMETER_LIMITS,
  LLMModel,
  PlaygroundTab,
  AgentExecutorRequest,
  AgentExecutorEvent,
  AgentExecutorEventType,
} from '../../core/models/playground.model';

// Tools available for the agent executor
const EXECUTOR_TOOLS: { id: string; label: string; icon: string }[] = [
  { id: 'web_search', label: 'Web Search',   icon: '🔍' },
  { id: 'code_exec',  label: 'Code Exec',    icon: '⚙️' },
  { id: 'file_read',  label: 'File Read',    icon: '📄' },
  { id: 'api_call',   label: 'API Call',     icon: '🌐' },
  { id: 'db_query',   label: 'DB Query',     icon: '🗄️' },
];

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaygroundComponent implements OnDestroy {
  private readonly playgroundService   = inject(PlaygroundService);
  private readonly agentExecutorService = inject(AgentExecutorService);
  private readonly store               = inject(AgentStore);
  private readonly router              = inject(Router);

  private executorSub?: Subscription;

  // ── Service signals ────────────────────────────────────────────────────────
  session        = this.playgroundService.session;
  streamingText  = this.playgroundService.streamingText;
  responses      = this.playgroundService.responses;
  isExecuting    = this.playgroundService.isExecuting;
  costEstimate   = this.playgroundService.costEstimate;
  modelComparison = this.playgroundService.modelComparison;
  systemPrompt   = this.playgroundService.systemPrompt;

  // ── Local UI state ─────────────────────────────────────────────────────────
  activeMainTab   = signal<PlaygroundTab>('llm-comparison');
  activeModelTab  = signal<ModelId>('gpt-4');
  showParameters  = signal(true);
  showSystemPrompt = signal(false);

  // Agent executor state
  agentTask        = signal<string>('');
  selectedAgentId  = signal<string>('agent-001');
  selectedTools    = signal<string[]>(['web_search', 'code_exec']);
  maxSteps         = signal<number>(5);
  executorEvents   = signal<AgentExecutorEvent[]>([]);
  isExecutorRunning = signal<boolean>(false);

  // ── Constants ──────────────────────────────────────────────────────────────
  readonly models     = AVAILABLE_MODELS;
  readonly paramLimits = PARAMETER_LIMITS;
  readonly modelIds: ModelId[] = Object.keys(AVAILABLE_MODELS) as ModelId[];
  readonly executorTools = EXECUTOR_TOOLS;

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Agents for the executor dropdown — reads from AgentStore */
  readonly agentOptions = computed(() =>
    this.store.agents().map(a => ({ id: a.id, name: a.name, type: a.type, model: a.model })),
  );

  // ── LLM Comparison methods ─────────────────────────────────────────────────

  onPromptChange(event: Event): void {
    this.playgroundService.updatePrompt((event.target as HTMLTextAreaElement).value);
  }

  onSystemPromptChange(event: Event): void {
    this.playgroundService.updateSystemPrompt((event.target as HTMLTextAreaElement).value);
  }

  onParameterChange(param: string, event: Event): void {
    this.playgroundService.updateParameters({ [param]: +(event.target as HTMLInputElement).value });
  }

  toggleModel(modelId: ModelId): void {
    this.playgroundService.toggleModel(modelId);
  }

  runComparison(): void {
    this.playgroundService.executeComparison();
  }

  cancelExecution(): void {
    this.playgroundService.cancelAllStreams();
  }

  selectTab(modelId: ModelId): void {
    this.activeModelTab.set(modelId);
  }

  selectMainTab(tab: PlaygroundTab): void {
    this.activeMainTab.set(tab);
  }

  getModelConfig(modelId: ModelId): LLMModel {
    return this.models[modelId];
  }

  isModelSelected(modelId: ModelId): boolean {
    return this.session().selectedModels.includes(modelId);
  }

  getResponseForModel(modelId: ModelId) {
    return this.responses().find(r => r.modelId === modelId);
  }

  // ── Agent Executor methods ─────────────────────────────────────────────────

  onAgentTaskChange(event: Event): void {
    this.agentTask.set((event.target as HTMLTextAreaElement).value);
  }

  onAgentIdChange(event: Event): void {
    this.selectedAgentId.set((event.target as HTMLSelectElement).value);
  }

  onMaxStepsChange(event: Event): void {
    this.maxSteps.set(+(event.target as HTMLInputElement).value);
  }

  toggleTool(toolId: string): void {
    this.selectedTools.update(tools =>
      tools.includes(toolId)
        ? tools.filter(t => t !== toolId)
        : [...tools, toolId],
    );
  }

  isToolSelected(toolId: string): boolean {
    return this.selectedTools().includes(toolId);
  }

  runAgentExecutor(): void {
    const task = this.agentTask().trim();
    if (!task) return;

    this.executorEvents.set([]);
    this.isExecutorRunning.set(true);

    const req: AgentExecutorRequest = {
      executionId: `exec-pg-${Date.now()}`,
      agentId:     this.selectedAgentId(),
      task,
      tools:       this.selectedTools(),
      maxSteps:    this.maxSteps(),
    };

    this.executorSub = this.agentExecutorService.execute(req).subscribe({
      next: (event: AgentExecutorEvent) => {
        this.executorEvents.update(events => [...events, event]);
      },
      error: (err: Error) => {
        this.executorEvents.update(events => [
          ...events,
          { type: 'error', stepNumber: events.length + 1, error: err.message },
        ]);
        this.isExecutorRunning.set(false);
      },
      complete: () => {
        this.isExecutorRunning.set(false);
      },
    });
  }

  cancelExecutor(): void {
    const req = this.executorEvents();
    if (req.length > 0) {
      // Extract executionId from the last-used request — use agentExecutorService.cancelAll()
      this.agentExecutorService.cancelAll();
    }
    this.isExecutorRunning.set(false);
  }

  clearExecutorEvents(): void {
    this.executorEvents.set([]);
  }

  // ── Event display helpers ──────────────────────────────────────────────────

  getEventIcon(type: AgentExecutorEventType): string {
    const icons: Record<AgentExecutorEventType, string> = {
      thought:        '💭',
      tool_call:      '🔧',
      tool_result:    '✅',
      final_response: '🏁',
      error:          '❌',
    };
    return icons[type] ?? '•';
  }

  getEventLabel(type: AgentExecutorEventType): string {
    const labels: Record<AgentExecutorEventType, string> = {
      thought:        'Thought',
      tool_call:      'Tool Call',
      tool_result:    'Tool Result',
      final_response: 'Final Response',
      error:          'Error',
    };
    return labels[type] ?? type;
  }

  // ── Formatting ─────────────────────────────────────────────────────────────

  formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  formatLatency(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
  }

  formatDuration(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  }

  getWinnerBadge(modelId: ModelId): string | null {
    const comparison = this.modelComparison();
    if (!comparison) return null;
    if (comparison.fastestModel       === modelId) return '⚡ Fastest';
    if (comparison.cheapestModel      === modelId) return '💰 Cheapest';
    if (comparison.highestQualityModel === modelId) return '🏆 Best Quality';
    if (comparison.bestValueModel      === modelId) return '⭐ Best Value';
    return null;
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  ngOnDestroy(): void {
    this.executorSub?.unsubscribe();
    this.agentExecutorService.cancelAll();
    this.playgroundService.cancelAllStreams();
  }
}
