// ============================================
// Error Tracking & Debugging Models
// Deep debugging with context snapshots,
// token metering, and retry configuration
// ============================================

// New error types for agentic AI failures
// 'hallucination' and 'format_error' are unique to this component
export type AgentErrorType =
  | 'hallucination'    // Agent fabricates facts, cites non-existent sources, invents data
  | 'tool_failure'     // API timeouts, incorrect parameters, tool crashes
  | 'timeout'          // Agent exceeds max execution time
  | 'rate_limit'       // Provider throttling (429s, quota exhaustion)
  | 'format_error'     // Agent output doesn't match expected schema/format
  | 'context_overflow' // Prompt + history exceeds model context window
  | 'loop_detected';   // Agent repeats same action in infinite loop

export type AgentErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ContextSnapshot {
  prompt: string;                         // System prompt at time of error
  conversationHistory: ConversationTurn[]; // Recent turns leading to error
  toolsAvailable: string[];               // Tools agent had access to
  tokensUsed: number;                     // Tokens consumed up to error point
  contextWindowMax: number;               // Model's max context window
  contextUtilization: number;             // tokensUsed / contextWindowMax (0-1)
  activeMemoryItems: string[];            // What was in agent's working memory
  environmentVariables: Record<string, string>; // Agent config at error time
}

export interface ConversationTurn {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tokenCount: number;
  timestamp: Date;
  toolName?: string;
}

export interface AgentError {
  errorId: string;
  agentId: string;
  agentName: string;
  taskId: string;
  taskName: string;
  errorType: AgentErrorType;
  severity: AgentErrorSeverity;
  errorMessage: string;
  stackTrace: string;
  contextSnapshot: ContextSnapshot;
  tokenUsage: RequestTokenUsage;           // Token breakdown for the failing request
  retryable: boolean;
  retryAttempts: number;
  maxRetries: number;
  resolution?: AgentErrorResolution;
  model: string;
  timestamp: Date;
  duration: number;                         // How long the request ran before failing (ms)
  cost: number;                             // Cost wasted on this error
}

export type AgentErrorResolution =
  | 'auto_retry_success'   // Automatic retry fixed it
  | 'fallback_model'       // Switched to a different model
  | 'prompt_rewrite'       // System rewrote the prompt and succeeded
  | 'context_pruned'       // Trimmed context window and retried
  | 'manual_intervention'  // Human stepped in
  | 'abandoned'            // Gave up
  | 'pending';             // Still unresolved

// ============================================
// Token Tracking Models
// Per-request, per-session, per-agent token accounting
// ============================================

export interface RequestTokenUsage {
  requestId: string;
  inputTokens: number;        // Prompt tokens sent to model
  outputTokens: number;       // Completion tokens received
  totalTokens: number;        // input + output
  cachedTokens: number;       // Tokens served from cache (prompt caching)
  model: string;
  contextWindowMax: number;   // Model's limit
  utilization: number;        // totalTokens / contextWindowMax (0-1)
  cost: number;               // Cost of this specific request
  timestamp: Date;
  agentId: string;
  latency: number;            // Response time in ms
}

export interface SessionTokenSummary {
  sessionId: string;
  agentId: string;
  agentName: string;
  model: string;
  requests: RequestTokenUsage[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgInputPerRequest: number;
  avgOutputPerRequest: number;
  peakUtilization: number;    // Highest context utilization seen
  requestCount: number;
  startTime: Date;
  endTime?: Date;
  contextWindowMax: number;
  tokenBudget: number;        // Max tokens allocated for this session
  tokenBudgetUsed: number;    // Percentage of budget consumed
}

// ============================================
// Retry Configuration Models
// Per-error-type retry policies
// ============================================

export interface RetryPolicy {
  errorType: AgentErrorType;
  enabled: boolean;
  maxRetries: number;
  backoffType: 'fixed' | 'linear' | 'exponential';
  initialDelayMs: number;
  maxDelayMs: number;
  retryOnModels: string[];         // Which models to retry on (empty = same model)
  fallbackModel?: string;          // Switch to this model on final retry
  contextPruneOnRetry: boolean;    // Auto-prune context before retry
  promptRewriteOnRetry: boolean;   // Auto-rewrite prompt before retry
}

export interface RetryConfigSummary {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  avgRetriesPerError: number;
  costSavedByRetries: number;
  costWastedOnRetries: number;
  mostRetriedErrorType: AgentErrorType;
  retrySuccessRateByType: Record<AgentErrorType, number>;
}

// ============================================
// Hallucination Detection Models
// Specific tracking for fabricated outputs
// ============================================

export interface HallucinationDetail {
  errorId: string;
  claimedFact: string;           // What the agent said
  groundTruth?: string;          // What the truth actually was (if known)
  confidence: number;            // How confident the detector is (0-1)
  category: HallucinationCategory;
  sourceDocuments: string[];     // Documents the agent should have referenced
  agentOutput: string;           // Full agent output containing the hallucination
}

export type HallucinationCategory =
  | 'fabricated_source'    // Cites a paper/URL that doesn't exist
  | 'invented_data'        // Makes up statistics or numbers
  | 'wrong_attribution'    // Attributes info to wrong source
  | 'temporal_confusion'   // Confuses dates/timelines
  | 'entity_confusion'     // Confuses people, companies, concepts
  | 'capability_claim';    // Claims it can do something it cannot

// ============================================
// Hallucination Trend Analysis Models
// Track hallucination occurrences over time
// ============================================

export interface HallucinationTrend {
  timestamp: Date;
  count: number;              // Number of hallucinations in this time window
  rate: number;               // Hallucinations / total errors (0-1)
  categoryBreakdown: Record<HallucinationCategory, number>;
  avgConfidence: number;      // Average confidence score across hallucinations
}

// ============================================
// Ground Truth Comparison Models
// Side-by-side comparison of expected vs actual
// ============================================

export interface GroundTruthComparison {
  errorId: string;
  agentOutput: string;        // What the agent actually said
  expectedOutput?: string;    // What it should have said (if known)
  diffSegments: DiffSegment[]; // Highlighted differences
  verificationStatus: 'verified_false' | 'verified_true' | 'unverified' | 'false_positive';
  verifiedBy?: string;        // User or system that verified
  verifiedAt?: Date;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  startIndex: number;
  endIndex: number;
}
