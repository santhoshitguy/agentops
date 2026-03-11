/**
 * Playground Models
 * Multi-model prompt testing sandbox with real-time streaming and cost estimation
 */

// ============================================
// Playground Top-level Tabs
// ============================================

export type PlaygroundTab = 'llm-comparison' | 'agent-executor';

// ============================================
// SSE Streaming — Request + Event types
// ============================================

/** Request sent to POST /api/playground/stream */
export interface StreamRequest {
    streamId:      string;
    modelId:       ModelId;
    prompt:        string;
    systemPrompt?: string;
    parameters:    ModelParameters;
}

/** One SSE event chunk from the server */
export interface StreamEvent {
    done:          boolean;
    delta:         string;            // incremental text for this chunk
    content?:      string;            // accumulated text so far (optional)
    tokensUsed?:   { input: number; output: number; total: number };
    cost?:         number;
    latency?:      number;            // ms from request start
    finishReason?: 'stop' | 'length' | 'error';
    error?:        string;
}

// ============================================
// Agent Executor Loop
// ============================================

export interface AgentExecutorRequest {
    executionId: string;
    agentId:     string;
    task:        string;
    tools:       string[];
    maxSteps?:   number;              // default 5
    model?:      string;
}

export type AgentExecutorEventType =
    | 'thought'
    | 'tool_call'
    | 'tool_result'
    | 'final_response'
    | 'error';

export interface AgentExecutorEvent {
    type:       AgentExecutorEventType;
    stepNumber: number;
    content?:   string;           // thought text or final response
    tool?:      string;           // tool name for tool_call events
    args?:      string;           // JSON-encoded args for tool_call
    result?:    string;           // tool result text
    metrics?:   {
        tokensUsed:     number;
        cost:           number;
        durationMs:     number;
        stepsCompleted: number;
    };
    error?:     string;
}

// ============================================
// LLM Model Definitions
// ============================================

/**
 * Available LLM models for testing
 */
export type ModelId = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro' | 'llama-2-70b';

/**
 * LLM Model configuration
 */
export interface LLMModel {
    id: ModelId;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'meta';
    inputCostPer1kTokens: number;   // USD
    outputCostPer1kTokens: number;  // USD
    maxTokens: number;              // Max context window
    supportsStreaming: boolean;
    color: string;                  // For UI color coding
}

/**
 * Model parameter configuration
 */
export interface ModelParameters {
    temperature: number;            // 0-2, controls randomness
    maxTokens: number;              // 1-4096, max response length
    topP: number;                   // 0-1, nucleus sampling
    frequencyPenalty?: number;      // -2 to 2
    presencePenalty?: number;       // -2 to 2
}

// ============================================
// Playground Session
// ============================================

/**
 * PlaygroundSession - Persistent state for current testing session
 */
export interface PlaygroundSession {
    id: string;
    createdAt: Date;
    updatedAt: Date;

    // Current state
    prompt: string;
    parameters: ModelParameters;
    selectedModels: ModelId[];

    // History
    promptHistory: PlaygroundPrompt[];

    // Settings
    autoSave: boolean;
}

/**
 * Individual prompt execution
 */
export interface PlaygroundPrompt {
    id: string;
    sessionId: string;
    prompt: string;
    parameters: ModelParameters;
    models: ModelId[];
    timestamp: Date;

    // Results
    responses?: PlaygroundResponse[];
    comparison?: ModelComparison;
}

// ============================================
// Response & Streaming
// ============================================

/**
 * Response from a single model
 */
export interface PlaygroundResponse {
    id: string;
    promptId: string;
    modelId: ModelId;

    // Content
    content: string;
    isStreaming: boolean;
    streamProgress: number;         // 0-100%

    // Metrics
    tokensUsed: {
        input: number;
        output: number;
        total: number;
    };
    latency: number;                // ms
    cost: number;                   // USD
    qualityScore?: number;          // 0-10 (optional evaluation)

    // Timing
    startTime: Date;
    endTime?: Date;

    // Metadata
    error?: string;
    finishReason?: 'stop' | 'length' | 'error';
}

/**
 * Streaming chunk for real-time updates
 */
export interface StreamChunk {
    modelId: ModelId;
    promptId: string;
    content: string;              // Incremental text
    index: number;                // Character index
    delta: string;                // Just this chunk's text
    done: boolean;
}

// ============================================
// Model Comparison
// ============================================

/**
 * Comparison analysis across multiple models
 */
export interface ModelComparison {
    promptId: string;
    timestamp: Date;

    // Participating models
    models: ModelId[];

    // Aggregate metrics
    totalCost: number;
    avgLatency: number;
    avgQualityScore: number;

    // Rankings
    fastestModel: ModelId;
    cheapestModel: ModelId;
    highestQualityModel: ModelId;   // "Winner"

    // Cost efficiency
    bestValueModel: ModelId;        // (qualityScore / cost)

    // Detailed results
    results: ComparisonResult[];
}

/**
 * Individual model result in comparison
 */
export interface ComparisonResult {
    modelId: ModelId;
    response: PlaygroundResponse;

    // Rankings
    latencyRank: number;            // 1 = fastest
    costRank: number;               // 1 = cheapest
    qualityRank: number;            // 1 = highest quality

    // Relative metrics
    costVsFastest: number;          // % difference
    latencyVsSlowest: number;       // % difference
}

// ============================================
// Cost Estimation
// ============================================

/**
 * Pre-execution cost estimate
 */
export interface CostEstimate {
    modelId: ModelId;

    // Token estimates
    estimatedInputTokens: number;
    estimatedOutputTokens: number;

    // Cost breakdown
    inputCost: number;              // USD
    outputCost: number;             // USD
    totalCost: number;              // USD

    // Confidence
    confidence: 'low' | 'medium' | 'high';
}

/**
 * Aggregate cost estimate for all selected models
 */
export interface TotalCostEstimate {
    models: ModelId[];
    estimates: CostEstimate[];

    totalCost: number;              // Sum across all models
    minCost: number;                // Cheapest model
    maxCost: number;                // Most expensive model

    // Warnings
    exceedsBudget?: boolean;
    budgetLimit?: number;
}

// ============================================
// UI State
// ============================================

/**
 * Playground UI state
 */
export interface PlaygroundUIState {
    // Active tab (for multi-model results)
    activeModelTab: ModelId | null;

    // Execution state
    isExecuting: boolean;
    executingModels: ModelId[];

    // Layout
    splitPaneRatio: number;         // 0-1 (left panel width %)
    showParameterSidebar: boolean;

    // History
    showHistory: boolean;
    historyFilter?: string;
}

// ============================================
// Helper Types
// ============================================

/**
 * Prompt template for quick testing
 */
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    category: 'code' | 'creative' | 'analysis' | 'conversation' | 'custom';
    suggestedParameters?: Partial<ModelParameters>;
}

/**
 * Model availability status
 */
export interface ModelStatus {
    modelId: ModelId;
    available: boolean;
    reason?: string;              // If unavailable
    lastChecked: Date;
}

// ============================================
// Constants
// ============================================

/**
 * Default model parameters
 */
export const DEFAULT_PARAMETERS: ModelParameters = {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0
};

/**
 * Parameter constraints
 */
export const PARAMETER_LIMITS = {
    temperature: { min: 0, max: 2, step: 0.1 },
    maxTokens: { min: 1, max: 4096, step: 1 },
    topP: { min: 0, max: 1, step: 0.01 },
    frequencyPenalty: { min: -2, max: 2, step: 0.1 },
    presencePenalty: { min: -2, max: 2, step: 0.1 }
} as const;

/**
 * Available models configuration
 */
export const AVAILABLE_MODELS: Record<ModelId, LLMModel> = {
    'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        inputCostPer1kTokens: 0.03,
        outputCostPer1kTokens: 0.06,
        maxTokens: 8192,
        supportsStreaming: true,
        color: '#10a37f'
    },
    'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        inputCostPer1kTokens: 0.0015,
        outputCostPer1kTokens: 0.002,
        maxTokens: 4096,
        supportsStreaming: true,
        color: '#74aa9c'
    },
    'claude-3-opus': {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        inputCostPer1kTokens: 0.015,
        outputCostPer1kTokens: 0.075,
        maxTokens: 4096,
        supportsStreaming: true,
        color: '#d4a574'
    },
    'claude-3-sonnet': {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        inputCostPer1kTokens: 0.003,
        outputCostPer1kTokens: 0.015,
        maxTokens: 4096,
        supportsStreaming: true,
        color: '#c19a6b'
    },
    'gemini-pro': {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        inputCostPer1kTokens: 0.00025,
        outputCostPer1kTokens: 0.0005,
        maxTokens: 2048,
        supportsStreaming: true,
        color: '#4285f4'
    },
    'llama-2-70b': {
        id: 'llama-2-70b',
        name: 'Llama 2 70B',
        provider: 'meta',
        inputCostPer1kTokens: 0.0007,
        outputCostPer1kTokens: 0.0009,
        maxTokens: 4096,
        supportsStreaming: true,
        color: '#0668e1'
    }
};

/**
 * Sample prompt templates
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: 'code-review',
        name: 'Code Review',
        description: 'Review code for best practices',
        category: 'code',
        prompt: 'Review the following code and suggest improvements:\n\n```python\n# Your code here\n```',
        suggestedParameters: { temperature: 0.3, maxTokens: 2000 }
    },
    {
        id: 'creative-writing',
        name: 'Creative Writing',
        description: 'Generate creative content',
        category: 'creative',
        prompt: 'Write a short story about...',
        suggestedParameters: { temperature: 1.2, maxTokens: 1500 }
    },
    {
        id: 'data-analysis',
        name: 'Data Analysis',
        description: 'Analyze data and provide insights',
        category: 'analysis',
        prompt: 'Analyze the following data and provide key insights:\n\n',
        suggestedParameters: { temperature: 0.5, maxTokens: 1000 }
    }
];
