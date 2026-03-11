import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ComplianceService } from './compliance.service';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';
import {
  AgentError,
  AgentErrorType,
  AgentErrorSeverity,
  AgentErrorResolution,
  ContextSnapshot,
  ConversationTurn,
  RequestTokenUsage,
  SessionTokenSummary,
  RetryPolicy,
  RetryConfigSummary,
  HallucinationDetail,
  HallucinationCategory,
  HallucinationTrend,
  GroundTruthComparison,
  DiffSegment
} from '../models/error-debugger.model';

// ============================================
// Constants
// ============================================

const ERROR_TYPES: AgentErrorType[] = [
  'hallucination', 'tool_failure', 'timeout', 'rate_limit',
  'format_error', 'context_overflow', 'loop_detected'
];

const SEVERITY_WEIGHTS: Record<AgentErrorType, AgentErrorSeverity> = {
  hallucination: 'high',
  tool_failure: 'medium',
  timeout: 'medium',
  rate_limit: 'low',
  format_error: 'medium',
  context_overflow: 'high',
  loop_detected: 'critical'
};

const AGENTS = [
  { id: 'agent-001', name: 'Orchestrator' },
  { id: 'agent-002', name: 'Researcher' },
  { id: 'agent-003', name: 'Coder' },
  { id: 'agent-004', name: 'Writer' },
  { id: 'agent-005', name: 'Analyst' },
  { id: 'agent-006', name: 'Reviewer' },
];

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'claude-3-opus', 'gemini-1.5-pro'];

const CONTEXT_WINDOWS: Record<string, number> = {
  'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'claude-3.5-sonnet': 200000,
  'claude-3-opus': 200000, 'gemini-1.5-pro': 2000000
};

const TOOLS = ['web_search', 'code_executor', 'file_reader', 'database_query', 'send_email', 'api_caller', 'image_analyzer'];

const ERROR_MESSAGES: Record<AgentErrorType, string[]> = {
  hallucination: [
    'Agent cited non-existent research paper "Smith et al., 2024 - Neural Architecture Survey" in response',
    'Agent claimed API endpoint /v3/users exists but only /v2/users is available in the documentation',
    'Agent fabricated statistics: "97.3% accuracy rate" when no benchmark data was provided',
    'Agent attributed quote to wrong person - said Einstein but source was Feynman',
    'Agent claimed tool "sentiment_analyzer" is available but it was never registered',
    'Agent invented a library "fast-json-transform v3.2" that does not exist on npm',
  ],
  tool_failure: [
    'web_search tool returned HTTP 503 - Service temporarily unavailable after 3 retries',
    'database_query tool failed: relation "user_metrics_v2" does not exist',
    'code_executor crashed with OOM: process consumed 4.2GB exceeding 2GB limit',
    'api_caller received malformed JSON response from external endpoint',
    'file_reader permission denied on /var/secrets/config.yaml',
  ],
  timeout: [
    'Agent execution exceeded 120s maximum - stuck in reasoning loop analyzing 450 data points',
    'Model inference timeout after 60s - provider returned 504 Gateway Timeout',
    'Tool chain execution exceeded 90s limit - web_search → api_caller → database_query pipeline stalled',
  ],
  rate_limit: [
    'OpenAI API: 429 Too Many Requests - Rate limit 10000 TPM exceeded (used 10,847 TPM)',
    'Anthropic API: Rate limit on claude-3.5-sonnet - 40 requests/min quota exhausted',
    'Token-per-minute limit reached on gpt-4o: 30000 TPM used of 30000 TPM allowed. Retry after 23s',
  ],
  format_error: [
    'Expected JSON object with keys {action, reasoning, confidence} but got plain text string',
    'Agent output missing required "sources" array in research response schema',
    'Tool call arguments malformed: expected {query: string, limit: number} but received {q: string}',
    'Agent returned markdown table instead of required CSV format for data export',
  ],
  context_overflow: [
    'Context window exceeded: 135,421/128,000 tokens after appending tool results from web_search',
    'Conversation history (87 turns) consumed 142K tokens - exceeds gpt-4o 128K context window',
    'Memory buffer overflow: 23 cached documents (198K tokens total) cannot fit in model context',
  ],
  loop_detected: [
    'Agent repeated "search_database → analyze_results → search_database" 8 times without progress',
    'Infinite planning loop detected: agent generated 12 identical plans without executing any',
    'Tool retry loop: agent called api_caller with same parameters 6 consecutive times after failures',
  ],
};

const STACK_TRACES: Record<AgentErrorType, string[]> = {
  hallucination: [
    `HallucinationError: Fabricated source detected
    at OutputValidator.checkSources (output-validator.ts:89)
    at FactChecker.verify (fact-checker.ts:45)
    at AgentRunner.postProcess (agent-runner.ts:201)
    at async Pipeline.finalize (pipeline.ts:134)`,
  ],
  tool_failure: [
    `ToolExecutionError: Tool 'web_search' failed
    at ToolExecutor.run (tool-executor.ts:67)
    at AgentRunner.executeToolCall (agent-runner.ts:142)
    at async StepExecutor.process (step-executor.ts:89)`,
  ],
  timeout: [
    `TimeoutError: Execution exceeded max duration
    at AbortController.timeout (abort-controller.ts:23)
    at InferenceClient.send (inference-client.ts:142)
    at async AgentRunner.think (agent-runner.ts:78)`,
  ],
  rate_limit: [
    `RateLimitError: 429 Too Many Requests
    at APIClient.handleResponse (api-client.ts:201)
    at ModelProvider.complete (model-provider.ts:78)
    at async AgentLoop.infer (agent-loop.ts:134)`,
  ],
  format_error: [
    `OutputFormatError: Schema validation failed
    at SchemaValidator.validate (schema-validator.ts:56)
    at OutputParser.parse (output-parser.ts:34)
    at async AgentRunner.processOutput (agent-runner.ts:167)`,
  ],
  context_overflow: [
    `ContextOverflowError: Token count exceeds model limit
    at TokenCounter.validate (token-counter.ts:31)
    at PromptBuilder.build (prompt-builder.ts:92)
    at async AgentRunner.prepare (agent-runner.ts:44)`,
  ],
  loop_detected: [
    `LoopDetectionError: Repeated action pattern detected
    at LoopDetector.check (loop-detector.ts:78)
    at AgentRunner.preExecute (agent-runner.ts:56)
    at async Pipeline.step (pipeline.ts:98)`,
  ],
};

const SYSTEM_PROMPTS = [
  'You are a helpful AI assistant. Use tools when needed. Always cite sources.',
  'You are a code review agent. Analyze code for bugs and suggest improvements.',
  'You are a research assistant. Search for information and provide summaries with citations.',
  'You are a data analyst. Query databases and create reports with visualizations.',
];

const USER_MESSAGES = [
  'Find the latest quarterly revenue for Acme Corp and compare it to last year.',
  'Review the authentication module for security vulnerabilities.',
  'Search for papers on attention mechanisms published in 2024.',
  'Generate a performance report for our API endpoints from the last 7 days.',
  'Summarize the top 10 customer complaints from the support tickets.',
  'Write unit tests for the payment processing module.',
];

// ============================================
// Service
// ============================================

@Injectable({ providedIn: 'root' })
export class ErrorDebuggerService {
  private readonly seedData = inject(SeedDataService);
  private readonly dataMode = inject(DataModeService);

  // Core state
  private readonly _errors = signal<AgentError[]>([]);
  private readonly _sessions = signal<SessionTokenSummary[]>([]);
  private readonly _retryPolicies = signal<RetryPolicy[]>(this.generateDefaultPolicies());
  private readonly _hallucinationDetails = signal<HallucinationDetail[]>(this.seedData.getHallucinationDetails());

  // Selection state
  readonly selectedErrorId = signal<string | null>(null);

  // Public readonly signals
  readonly errors = this._errors.asReadonly();
  readonly sessions = this._sessions.asReadonly();
  readonly retryPolicies = this._retryPolicies.asReadonly();
  readonly hallucinationDetails = this._hallucinationDetails.asReadonly();

  // Computed
  readonly selectedError = computed(() => {
    const id = this.selectedErrorId();
    if (!id) return null;
    return this._errors().find(e => e.errorId === id) ?? null;
  });

  readonly errorCountByType = computed(() => {
    const counts: Record<string, number> = {};
    this._errors().forEach(e => {
      counts[e.errorType] = (counts[e.errorType] || 0) + 1;
    });
    return counts;
  });

  readonly criticalErrors = computed(() =>
    this._errors().filter(e => e.severity === 'critical' || e.severity === 'high')
  );

  readonly unresolvedErrors = computed(() =>
    this._errors().filter(e => !e.resolution || e.resolution === 'pending')
  );

  readonly totalTokensConsumed = computed(() =>
    this._sessions().reduce((sum, s) => sum + s.totalTokens, 0)
  );

  readonly totalCostFromTokens = computed(() =>
    this._sessions().reduce((sum, s) => sum + s.totalCost, 0)
  );

  readonly avgContextUtilization = computed(() => {
    const sessions = this._sessions();
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + s.peakUtilization, 0) / sessions.length;
  });

  readonly retryConfigSummary = computed((): RetryConfigSummary => {
    const errors = this._errors();
    const retried = errors.filter(e => e.retryAttempts > 0);
    const successful = retried.filter(e => e.resolution === 'auto_retry_success');
    const byType: Record<string, { total: number; success: number }> = {};

    retried.forEach(e => {
      if (!byType[e.errorType]) byType[e.errorType] = { total: 0, success: 0 };
      byType[e.errorType].total++;
      if (e.resolution === 'auto_retry_success') byType[e.errorType].success++;
    });

    const retrySuccessRateByType: Record<AgentErrorType, number> = {} as Record<AgentErrorType, number>;
    ERROR_TYPES.forEach(t => {
      const entry = byType[t];
      retrySuccessRateByType[t] = entry ? (entry.success / entry.total) * 100 : 0;
    });

    const costSaved = successful.reduce((s, e) => s + e.cost * 2, 0); // would have cost 2x without retry
    const costWasted = retried.filter(e => e.resolution !== 'auto_retry_success').reduce((s, e) => s + e.cost * e.retryAttempts * 0.3, 0);

    const typeCounts = retried.reduce((acc, e) => {
      acc[e.errorType] = (acc[e.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostRetried = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRetries: retried.length,
      successfulRetries: successful.length,
      failedRetries: retried.length - successful.length,
      avgRetriesPerError: retried.length > 0 ? retried.reduce((s, e) => s + e.retryAttempts, 0) / retried.length : 0,
      costSavedByRetries: costSaved,
      costWastedOnRetries: costWasted,
      mostRetriedErrorType: (mostRetried ? mostRetried[0] : 'timeout') as AgentErrorType,
      retrySuccessRateByType
    };
  });

  // ============================================
  // Hallucination-Specific Computed Signals
  // ============================================

  readonly hallucinationsByCategory = computed(() => {
    const hallucinations = this._hallucinationDetails();
    const counts: Record<HallucinationCategory, number> = {
      fabricated_source: 0,
      invented_data: 0,
      wrong_attribution: 0,
      temporal_confusion: 0,
      entity_confusion: 0,
      capability_claim: 0
    };

    hallucinations.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });

    return counts;
  });

  readonly hallucinationTrend = computed((): HallucinationTrend[] => {
    const now = Date.now();
    const windowSizeMs = 2 * 60 * 60 * 1000; // 2-hour windows
    const windowCount = 12; // Last 24 hours
    const trends: HallucinationTrend[] = [];

    for (let i = 0; i < windowCount; i++) {
      const windowEnd = now - (i * windowSizeMs);
      const windowStart = windowEnd - windowSizeMs;

      const hallucinationsInWindow = this._hallucinationDetails().filter(h => {
        const errorTimestamp = this._errors().find(e => e.errorId === h.errorId)?.timestamp.getTime();
        return errorTimestamp && errorTimestamp >= windowStart && errorTimestamp < windowEnd;
      });

      const errorsInWindow = this._errors().filter(e => {
        const t = e.timestamp.getTime();
        return t >= windowStart && t < windowEnd;
      });

      const categoryBreakdown: Record<HallucinationCategory, number> = {
        fabricated_source: 0,
        invented_data: 0,
        wrong_attribution: 0,
        temporal_confusion: 0,
        entity_confusion: 0,
        capability_claim: 0
      };

      hallucinationsInWindow.forEach(h => {
        categoryBreakdown[h.category]++;
      });

      const avgConfidence = hallucinationsInWindow.length > 0
        ? hallucinationsInWindow.reduce((sum, h) => sum + h.confidence, 0) / hallucinationsInWindow.length
        : 0;

      trends.unshift({
        timestamp: new Date(windowStart),
        count: hallucinationsInWindow.length,
        rate: errorsInWindow.length > 0 ? hallucinationsInWindow.length / errorsInWindow.length : 0,
        categoryBreakdown,
        avgConfidence
      });
    }

    return trends;
  });

  readonly hallucinationRate = computed(() => {
    const totalErrors = this._errors().length;
    const hallucinationErrors = this._errors().filter(e => e.errorType === 'hallucination').length;
    return totalErrors > 0 ? hallucinationErrors / totalErrors : 0;
  });

  /** True when hallucination rate exceeds 15% — triggers compliance risk escalation */
  readonly hallucinationRateHigh = computed(() => this.hallucinationRate() > 0.15);

  private readonly complianceService = inject(ComplianceService);

  constructor() {
    this._errors.set(this.generateMockErrors(60));
    this._sessions.set(this.generateMockSessions(8));
    this._hallucinationDetails.set(this.generateMockHallucinations());

    // ---------------------------------------------------------------
    // Hallucination → Compliance Risk Integration
    // Watches hallucinationRate() and pushes updates to ComplianceService
    // whenever the rate changes. This keeps risk score reactive without
    // polling and without ComplianceService knowing about ErrorDebugger.
    // ---------------------------------------------------------------
    effect(() => {
      const rate = this.hallucinationRate();
      const hallucinationCount = this._errors().filter(e => e.errorType === 'hallucination').length;
      const isHigh = this.hallucinationRateHigh();


      this.complianceService.updateHallucinationRisk(rate, hallucinationCount);
    });

    effect(() => {
      if (this.dataMode.isMock()) {
        this._hallucinationDetails.set(this.seedData.getHallucinationDetails());
      }
    });
  }

  // ============================================
  // Public API
  // ============================================

  selectError(id: string | null): void { this.selectedErrorId.set(id); }

  getHallucinationDetail(errorId: string): HallucinationDetail | null {
    return this._hallucinationDetails().find(h => h.errorId === errorId) ?? null;
  }

  updateRetryPolicy(errorType: AgentErrorType, changes: Partial<RetryPolicy>): void {
    this._retryPolicies.update(policies =>
      policies.map(p => p.errorType === errorType ? { ...p, ...changes } : p)
    );
  }

  addError(error: AgentError): void {
    this._errors.update(list => [error, ...list]);
  }

  resolveError(errorId: string, resolution: AgentErrorResolution): void {
    this._errors.update(list =>
      list.map(e => e.errorId === errorId ? { ...e, resolution } : e)
    );
  }

  generateLiveError(): AgentError {
    return this.createMockError(Date.now());
  }

  // ============================================
  // Hallucination-Specific Methods
  // ============================================

  getHallucinationsByAgent(agentId: string): HallucinationDetail[] {
    const agentErrors = this._errors().filter(e => e.agentId === agentId && e.errorType === 'hallucination');
    const errorIds = new Set(agentErrors.map(e => e.errorId));
    return this._hallucinationDetails().filter(h => errorIds.has(h.errorId));
  }

  markFalsePositive(errorId: string, userId: string): void {
    // In a real app, this would update the backend
    // For now, just update resolution status
    this.resolveError(errorId, 'manual_intervention');
  }

  getGroundTruthComparison(errorId: string): GroundTruthComparison | null {
    const hallucination = this.getHallucinationDetail(errorId);
    if (!hallucination) return null;

    // Simple diff algorithm - in production, use a proper diff library
    const agentOutput = hallucination.agentOutput;
    const expectedOutput = hallucination.groundTruth || 'No ground truth available';

    return {
      errorId,
      agentOutput,
      expectedOutput,
      diffSegments: this.computeSimpleDiff(agentOutput, expectedOutput),
      verificationStatus: 'unverified'
    };
  }

  private computeSimpleDiff(actual: string, expected: string): DiffSegment[] {
    // Simplified diff - in production, use diff-match-patch or similar
    return [
      { type: 'removed', content: actual, startIndex: 0, endIndex: actual.length },
      { type: 'added', content: expected, startIndex: 0, endIndex: expected.length }
    ];
  }

  // ============================================
  // Mock Data Generation
  // ============================================

  private generateMockErrors(count: number): AgentError[] {
    const now = Date.now();
    const errors: AgentError[] = [];
    for (let i = 0; i < count; i++) {
      errors.push(this.createMockError(now - Math.random() * 86400000));
    }
    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private createMockError(baseTime: number): AgentError {
    const errorType = ERROR_TYPES[Math.floor(Math.random() * ERROR_TYPES.length)];
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const model = MODELS[Math.floor(Math.random() * MODELS.length)];
    const messages = ERROR_MESSAGES[errorType];
    const traces = STACK_TRACES[errorType];
    const severity = SEVERITY_WEIGHTS[errorType];
    const retryable = !['hallucination', 'loop_detected'].includes(errorType);
    const retryAttempts = retryable ? Math.floor(Math.random() * 4) : 0;
    const resolved = Math.random() > 0.35;
    const resolutions: AgentErrorResolution[] = ['auto_retry_success', 'fallback_model', 'prompt_rewrite', 'context_pruned', 'manual_intervention', 'abandoned'];

    const contextWindow = CONTEXT_WINDOWS[model] || 128000;
    const tokensUsed = Math.floor(contextWindow * (0.3 + Math.random() * 0.7));
    const inputTokens = Math.floor(tokensUsed * (0.6 + Math.random() * 0.3));
    const outputTokens = tokensUsed - inputTokens;

    const conversationHistory = this.generateConversationHistory(3 + Math.floor(Math.random() * 5));

    return {
      errorId: `dbg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId: agent.id,
      agentName: agent.name,
      taskId: `task-${Math.random().toString(36).slice(2, 8)}`,
      taskName: USER_MESSAGES[Math.floor(Math.random() * USER_MESSAGES.length)].slice(0, 60),
      errorType,
      severity,
      errorMessage: messages[Math.floor(Math.random() * messages.length)],
      stackTrace: traces[Math.floor(Math.random() * traces.length)],
      contextSnapshot: {
        prompt: SYSTEM_PROMPTS[Math.floor(Math.random() * SYSTEM_PROMPTS.length)],
        conversationHistory,
        toolsAvailable: TOOLS.slice(0, 3 + Math.floor(Math.random() * 4)),
        tokensUsed,
        contextWindowMax: contextWindow,
        contextUtilization: tokensUsed / contextWindow,
        activeMemoryItems: ['user_preferences', 'task_context', 'search_cache', 'code_snippets'].slice(0, 2 + Math.floor(Math.random() * 3)),
        environmentVariables: { temperature: '0.7', max_tokens: '4096', top_p: '0.95' }
      },
      tokenUsage: {
        requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
        inputTokens,
        outputTokens,
        totalTokens: tokensUsed,
        cachedTokens: Math.floor(inputTokens * Math.random() * 0.4),
        model,
        contextWindowMax: contextWindow,
        utilization: tokensUsed / contextWindow,
        cost: (inputTokens * 0.000003 + outputTokens * 0.000015),
        timestamp: new Date(baseTime),
        agentId: agent.id,
        latency: 500 + Math.floor(Math.random() * 8000),
      },
      retryable,
      retryAttempts,
      maxRetries: 3,
      resolution: resolved ? resolutions[Math.floor(Math.random() * resolutions.length)] : 'pending',
      model,
      timestamp: new Date(baseTime),
      duration: 200 + Math.floor(Math.random() * 15000),
      cost: inputTokens * 0.000003 + outputTokens * 0.000015,
    };
  }

  private generateConversationHistory(turns: number): ConversationTurn[] {
    const history: ConversationTurn[] = [];
    const roles: ('user' | 'assistant' | 'tool')[] = ['user', 'assistant', 'tool'];
    const now = Date.now();

    for (let i = 0; i < turns; i++) {
      const role = i === 0 ? 'user' as const : roles[i % 3];
      const tokenCount = role === 'user' ? 50 + Math.floor(Math.random() * 200)
        : role === 'assistant' ? 200 + Math.floor(Math.random() * 1500)
          : 100 + Math.floor(Math.random() * 500);

      history.push({
        role,
        content: role === 'user'
          ? USER_MESSAGES[Math.floor(Math.random() * USER_MESSAGES.length)]
          : role === 'tool'
            ? `{"results": [{"id": ${i}, "status": "ok", "data": "..."}]}`
            : 'Based on my analysis, I found the following relevant information...',
        tokenCount,
        timestamp: new Date(now - (turns - i) * 30000),
        toolName: role === 'tool' ? TOOLS[Math.floor(Math.random() * TOOLS.length)] : undefined,
      });
    }
    return history;
  }

  private generateMockSessions(count: number): SessionTokenSummary[] {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => {
      const agent = AGENTS[i % AGENTS.length];
      const model = MODELS[i % MODELS.length];
      const contextWindow = CONTEXT_WINDOWS[model] || 128000;
      const requestCount = 5 + Math.floor(Math.random() * 20);

      const requests: RequestTokenUsage[] = Array.from({ length: requestCount }, (_, j) => {
        const input = 500 + Math.floor(Math.random() * 5000);
        const output = 200 + Math.floor(Math.random() * 3000);
        return {
          requestId: `req-${i}-${j}`,
          inputTokens: input,
          outputTokens: output,
          totalTokens: input + output,
          cachedTokens: Math.floor(input * Math.random() * 0.3),
          model,
          contextWindowMax: contextWindow,
          utilization: (input + output) / contextWindow,
          cost: input * 0.000003 + output * 0.000015,
          timestamp: new Date(now - (count - i) * 3600000 + j * 60000),
          agentId: agent.id,
          latency: 300 + Math.floor(Math.random() * 5000),
        };
      });

      const totalInput = requests.reduce((s, r) => s + r.inputTokens, 0);
      const totalOutput = requests.reduce((s, r) => s + r.outputTokens, 0);
      const peakUtil = Math.max(...requests.map(r => r.utilization));
      const tokenBudget = contextWindow * requestCount * 0.5;

      return {
        sessionId: `session-dbg-${String(i + 1).padStart(3, '0')}`,
        agentId: agent.id,
        agentName: agent.name,
        model,
        requests,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        totalTokens: totalInput + totalOutput,
        totalCost: requests.reduce((s, r) => s + r.cost, 0),
        avgInputPerRequest: Math.round(totalInput / requestCount),
        avgOutputPerRequest: Math.round(totalOutput / requestCount),
        peakUtilization: peakUtil,
        requestCount,
        startTime: requests[0].timestamp,
        endTime: requests[requests.length - 1].timestamp,
        contextWindowMax: contextWindow,
        tokenBudget,
        tokenBudgetUsed: ((totalInput + totalOutput) / tokenBudget) * 100,
      };
    });
  }

  private generateDefaultPolicies(): RetryPolicy[] {
    return ERROR_TYPES.map(errorType => ({
      errorType,
      enabled: !['hallucination', 'loop_detected'].includes(errorType),
      maxRetries: errorType === 'rate_limit' ? 5 : errorType === 'timeout' ? 2 : 3,
      backoffType: errorType === 'rate_limit' ? 'exponential' as const : 'linear' as const,
      initialDelayMs: errorType === 'rate_limit' ? 5000 : 1000,
      maxDelayMs: errorType === 'rate_limit' ? 60000 : 10000,
      retryOnModels: [],
      fallbackModel: errorType === 'timeout' ? 'gpt-4o-mini' : undefined,
      contextPruneOnRetry: errorType === 'context_overflow',
      promptRewriteOnRetry: errorType === 'format_error',
    }));
  }

  private generateMockHallucinations(): HallucinationDetail[] {
    const halluErrors = this._errors().filter(e => e.errorType === 'hallucination');
    const categories: HallucinationCategory[] = [
      'fabricated_source', 'invented_data', 'wrong_attribution',
      'temporal_confusion', 'entity_confusion', 'capability_claim'
    ];

    return halluErrors.map((e, idx) => {
      const category = categories[idx % categories.length];

      // Generate realistic examples based on category
      let claimedFact: string;
      let groundTruth: string;

      switch (category) {
        case 'fabricated_source':
          claimedFact = 'Referenced paper "Smith et al., 2024 - Neural Architecture Survey"';
          groundTruth = 'No such paper exists in any database';
          break;
        case 'invented_data':
          claimedFact = 'Reported 97.3% accuracy rate';
          groundTruth = 'No benchmark data was provided in context';
          break;
        case 'wrong_attribution':
          claimedFact = 'Quote attributed to Einstein';
          groundTruth = 'Source was actually Feynman, 1965';
          break;
        case 'temporal_confusion':
          claimedFact = 'Event occurred in 2024';
          groundTruth = 'Event actually occurred in 2019';
          break;
        case 'entity_confusion':
          claimedFact = 'OpenAI developed Gemini model';
          groundTruth = 'Gemini is developed by Google DeepMind';
          break;
        case 'capability_claim':
          claimedFact = 'Tool "sentiment_analyzer" is available';
          groundTruth = 'Tool was never registered in the system';
          break;
        default:
          claimedFact = 'Unknown claim';
          groundTruth = 'Unknown ground truth';
      }

      return {
        errorId: e.errorId,
        claimedFact,
        groundTruth,
        confidence: 0.65 + Math.random() * 0.33, // 0.65-0.98 range
        category,
        sourceDocuments: ['api-docs.md', 'knowledge-base.json', 'context-cache'].slice(0, 1 + Math.floor(Math.random() * 2)),
        agentOutput: e.errorMessage,
      };
    });
  }
}
