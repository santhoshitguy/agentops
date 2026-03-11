/**
 * agent-executor.service.ts
 *
 * Drives the "Agent Executor Loop" tab in the Playground.
 *
 * Two execution paths:
 *
 *   Mock mode — generates a synthetic multi-step ReAct loop using Observable
 *               timers so it feels realistic without any network call.
 *
 *   Live mode — streams `POST /api/agents/:id/execute` SSE via the same
 *               fetch + ReadableStream pattern used by LlmStreamService.
 *
 * Emits: `Observable<AgentExecutorEvent>`
 *   thought       → agent reasoning step
 *   tool_call     → tool invocation
 *   tool_result   → tool output
 *   final_response→ synthesized answer + timing metrics
 *   error         → caught runtime error
 *
 * The service also writes live execution data into AgentStore so that the
 * main dashboard (execution list, token counters) reflects what is happening
 * in the Playground.
 */

import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, concat, of, timer } from 'rxjs';
import { concatMap, delay, finalize, takeUntil } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { DataModeService } from './data-mode.service';
import { AgentStore } from '../store/agent.store';
import {
  AgentExecutorRequest,
  AgentExecutorEvent,
  AgentExecutorEventType,
} from '../models/playground.model';
import { AgentExecution, AgentType } from '../models/agent.model';

const ACCESS_TOKEN_KEY = 'agentops-access-token';

// ── Mock step scripts per tool set ─────────────────────────────────────────

function buildMockSteps(task: string, tools: string[]): AgentExecutorEvent[] {
  const hasTool = (name: string) => tools.includes(name);
  const steps: AgentExecutorEvent[] = [];
  let stepNo = 0;

  // Step 1 — initial reasoning
  steps.push({
    type:       'thought',
    stepNumber: ++stepNo,
    content:    `Analyzing the task: "${task}". I need to break this down into sub-tasks and determine which tools will be most helpful.`,
  });

  // Step 2 — first tool call (if available)
  if (hasTool('web_search') || hasTool('api_call')) {
    const tool = hasTool('web_search') ? 'web_search' : 'api_call';
    const query = task.length > 40 ? task.slice(0, 40) + '...' : task;
    steps.push({ type: 'tool_call', stepNumber: ++stepNo, tool, args: JSON.stringify({ query }) });
    steps.push({
      type:       'tool_result',
      stepNumber: ++stepNo,
      result:     `Retrieved 5 relevant results. Top match: "Comprehensive guide to ${query.split(' ').slice(0, 4).join(' ')}..." (relevance: 0.94)`,
    });
  }

  // Step 3 — secondary reasoning
  steps.push({
    type:       'thought',
    stepNumber: ++stepNo,
    content:    `Processing retrieved information. I can see patterns that are directly relevant to the task. Let me now generate a structured response.`,
  });

  // Step 4 — code execution if available
  if (hasTool('code_exec')) {
    steps.push({
      type:       'tool_call',
      stepNumber: ++stepNo,
      tool:       'code_exec',
      args:       JSON.stringify({ language: 'python', code: `# Compute result for: ${task.slice(0, 30)}\nresult = process_task(task)\nprint(result)` }),
    });
    steps.push({
      type:       'tool_result',
      stepNumber: ++stepNo,
      result:     `Execution successful. Output:\n> Processed 1,247 tokens\n> Confidence score: 0.89\n> Result: Task completed with high confidence`,
    });
  }

  // Step 5 — optional DB query
  if (hasTool('db_query')) {
    steps.push({
      type:       'tool_call',
      stepNumber: ++stepNo,
      tool:       'db_query',
      args:       JSON.stringify({ sql: `SELECT * FROM knowledge_base WHERE topic LIKE '%${task.split(' ')[0]}%' LIMIT 5` }),
    });
    steps.push({
      type:       'tool_result',
      stepNumber: ++stepNo,
      result:     `Query returned 3 matching records. Relevant context extracted and merged into response context.`,
    });
  }

  // Final response
  const duration = 800 + stepNo * 200;
  const tokens   = 150 + stepNo * 80;
  steps.push({
    type:       'final_response',
    stepNumber: ++stepNo,
    content:    `Based on my analysis${tools.length > 0 ? ` and using ${tools.join(', ')}` : ''}, here is my comprehensive response to your task:\n\n**${task}**\n\nI have successfully processed your request through ${stepNo - 1} reasoning steps. The analysis reveals that the task requires a multi-faceted approach:\n\n1. **Information Gathering** — Collected relevant context from ${tools.length} sources\n2. **Processing** — Applied structured reasoning to synthesize findings\n3. **Validation** — Cross-referenced results for accuracy\n\nThe execution completed with a confidence score of 0.89, with ${tokens} tokens used across all steps.`,
    metrics: {
      tokensUsed:     tokens,
      cost:           tokens * 0.000003,
      durationMs:     duration,
      stepsCompleted: stepNo - 1,
    },
  });

  return steps;
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AgentExecutorService {
  private dataMode = inject(DataModeService);
  private store    = inject(AgentStore);

  /** Cancellation subjects — keyed by executionId */
  private readonly cancellers = new Map<string, Subject<void>>();

  /** Global "any execution is running" flag */
  readonly isExecuting = signal(false);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Execute an agent loop and return an Observable of step events.
   *
   * Caller should subscribe and collect events into a local signal:
   *   this.agentExecutorService.execute(req).subscribe(event => ...)
   */
  execute(req: AgentExecutorRequest): Observable<AgentExecutorEvent> {
    this.isExecuting.set(true);

    // Register an execution in the store so the dashboard tracks it
    this.registerExecution(req);

    // Cleanup on complete or error
    const teardown = () => {
      this.isExecuting.set(false);
      this.cancellers.delete(req.executionId);
    };

    return this.dataMode.isMock()
      ? this.executeMock(req).pipe(finalize(teardown))
      : this.executeLive(req).pipe(finalize(teardown));
  }

  /** Cancel a running execution by ID */
  cancel(executionId: string): void {
    this.cancellers.get(executionId)?.next();
    this.cancellers.get(executionId)?.complete();
    this.cancellers.delete(executionId);
    this.isExecuting.set(false);
  }

  /** Cancel all running executions */
  cancelAll(): void {
    this.cancellers.forEach(s => { s.next(); s.complete(); });
    this.cancellers.clear();
    this.isExecuting.set(false);
  }

  // ── Mock execution path ──────────────────────────────────────────────────

  private executeMock(req: AgentExecutorRequest): Observable<AgentExecutorEvent> {
    const cancel$ = new Subject<void>();
    this.cancellers.set(req.executionId, cancel$);

    const maxSteps = req.maxSteps ?? 5;
    const steps = buildMockSteps(req.task, req.tools).slice(0, maxSteps + 1); // +1 for final response

    // Emit each step after a realistic delay
    const stepDelays: Record<AgentExecutorEventType, number> = {
      thought:        900,
      tool_call:      600,
      tool_result:    500,
      final_response: 400,
      error:          0,
    };

    // Build a sequence: delay(n) then emit step
    const stepObservables = steps.map(step =>
      of(step).pipe(delay(stepDelays[step.type] + Math.random() * 300)),
    );

    return concat(...stepObservables).pipe(takeUntil(cancel$));
  }

  // ── Live execution path ──────────────────────────────────────────────────

  private executeLive(req: AgentExecutorRequest): Observable<AgentExecutorEvent> {
    const cancel$ = new Subject<void>();
    this.cancellers.set(req.executionId, cancel$);

    return new Observable<AgentExecutorEvent>(observer => {
      const controller = new AbortController();

      const baseUrl = environment.apiUrl;
      const token   = localStorage.getItem(ACCESS_TOKEN_KEY);

      fetch(`${baseUrl}/api/agents/${req.agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          execution_id: req.executionId,
          task:         req.task,
          tools:        req.tools,
          max_steps:    req.maxSteps ?? 5,
          model:        req.model,
        }),
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) throw new Error(`Execute failed: HTTP ${res.status}`);
          return res.body!.getReader();
        })
        .then(reader => {
          const decoder = new TextDecoder();
          let buffer = '';

          const read = (): Promise<void> =>
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split('\n\n');
              buffer = events.pop() ?? '';

              for (const block of events) {
                for (const line of block.split('\n')) {
                  if (line.startsWith('data: ')) {
                    try {
                      const evt = JSON.parse(line.slice(6)) as AgentExecutorEvent;
                      observer.next(evt);
                      if (evt.type === 'final_response' || evt.type === 'error') {
                        observer.complete();
                        return;
                      }
                    } catch { /* skip malformed */ }
                  }
                }
              }
              return read();
            });

          return read();
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') observer.error(err);
          else observer.complete();
        });

      const cancelSub = cancel$.subscribe(() => controller.abort());
      return () => { controller.abort(); cancelSub.unsubscribe(); };
    });
  }

  // ── Store integration ────────────────────────────────────────────────────

  private registerExecution(req: AgentExecutorRequest): void {
    const execution: AgentExecution = {
      id:         req.executionId,
      agentId:    req.agentId,
      agentName:  req.agentId,  // component can resolve name from store
      agentType:  'orchestrator' as AgentType,
      taskId:     `task-${Date.now()}`,
      taskName:   req.task.slice(0, 60),
      status:     'executing',
      priority:   'normal',
      startTime:  new Date(),
      progress:   0,
      steps:      [],
      tokensUsed: 0,
      maxTokens:  128_000,
      cost:       0,
      model:      req.model ?? 'gpt-4o',
      tags:       ['playground', 'agent-executor'],
    };

    this.store.addExecution(execution);
  }
}
