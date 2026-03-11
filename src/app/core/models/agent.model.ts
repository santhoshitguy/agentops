// ============================================
// AgentOps Lite - Data Models
// ============================================

export type AgentStatus = 'active' | 'idle' | 'processing' | 'error' | 'waiting';

export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    model: string;
    tokensUsed: number;
    tokensLimit: number;
    costPerHour: number;
    successRate: number;
    avgResponseTime: number;
    tasksCompleted: number;
    tasksInQueue: number;
    lastActive: Date;
    position?: { x: number; y: number };
    connections?: string[];
}

export type AgentType =
    | 'researcher'
    | 'writer'
    | 'coder'
    | 'reviewer'
    | 'orchestrator'
    | 'analyst'
    | 'assistant';

export interface AgentConnection {
    id: string;
    from: string;
    to: string;
    status: 'active' | 'idle' | 'error';
    dataFlow: number; // packets per second
    latency: number; // ms
}

export interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    agentId: string;
    agentName: string;
    message: string;
    metadata?: Record<string, unknown>;
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface GaugeConfig {
    value: number;
    maxValue: number;
    label: string;
    unit?: string;
    color: 'cyan' | 'purple' | 'pink' | 'green' | 'orange' | 'red';
    showTicks?: boolean;
    animated?: boolean;
}

export interface Metric {
    id: string;
    label: string;
    value: number;
    previousValue?: number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: string;
}

export interface Task {
    id: string;
    name: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

export interface SystemHealth {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
    uptime: number;
    activeConnections: number;
}

export interface CostMetrics {
    totalCost: number;
    costPerAgent: Record<string, number>;
    projectedDailyCost: number;
    budgetLimit: number;
    budgetUsed: number;
}

export interface NavItem {
    id: string;
    label: string;
    icon: string;
    route?: string;
    badge?: number;
    children?: NavItem[];
    active?: boolean;
}

// ============================================
// Agent Activity Monitoring Models
// ============================================

export type ExecutionStatus = 'queued' | 'initializing' | 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type StepPhase = 'init' | 'plan' | 'execute' | 'respond';

export interface AgentStep {
    stepNumber: number;
    phase: StepPhase;
    action: string;
    description: string;
    input?: string;
    output?: string;
    duration: number;
    startTime: Date;
    endTime?: Date;
    success: boolean;
    tokensUsed: number;
    toolCalls?: ToolCall[];
    retryCount?: number;
}

export interface ToolCall {
    id: string;
    tool: string;
    args: string;
    result?: string;
    duration: number;
    success: boolean;
}

export interface AgentExecution {
    id: string;
    agentId: string;
    agentName: string;
    agentType: AgentType;
    taskId: string;
    taskName: string;
    status: ExecutionStatus;
    priority: 'low' | 'normal' | 'high' | 'critical';
    startTime: Date;
    endTime?: Date;
    estimatedDuration?: number;
    progress: number;
    steps: AgentStep[];
    tokensUsed: number;
    maxTokens: number;
    cost: number;
    model: string;
    parentExecutionId?: string;
    errorMessage?: string;
    tags?: string[];
}

export interface ExecutionStats {
    totalExecutions: number;
    running: number;
    queued: number;
    completed: number;
    failed: number;
    avgDuration: number;
    successRate: number;
    totalTokensUsed: number;
    totalCost: number;
    throughput: number;
}

// ============================================
// Tool Usage Analytics Models
// ============================================

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    category: 'data' | 'api' | 'compute' | 'communication' | 'storage' | 'analysis';
    parameters: { name: string; type: string }[];
}

export interface ToolUsage {
    toolId: string;
    toolName: string;
    category: ToolDefinition['category'];
    callCount: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageLatency: number;
    p95Latency: number;
    maxLatency: number;
    errorTypes: Record<string, number>;
    costPerCall: number;
    totalCost: number;
    lastUsed: Date;
    agentUsage: Record<string, number>;
}

export interface ToolHeatmapCell {
    hour: number;
    day: number;
    toolId: string;
    callCount: number;
    avgLatency: number;
    errorRate: number;
}

export interface ToolDependencyLink {
    source: string;
    target: string;
    coOccurrence: number;
    avgSequenceGap: number;
}

export interface ToolAnalyticsSummary {
    totalCalls: number;
    uniqueTools: number;
    avgLatency: number;
    overallSuccessRate: number;
    totalCost: number;
    mostUsedTool: string;
    slowestTool: string;
    leastReliableTool: string;
}

// ============================================
// Conversation / Task Flow Models
// ============================================

export type ThoughtStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
export type ThoughtType = 'reasoning' | 'tool_call' | 'decision' | 'observation' | 'final_response';

export interface ThoughtStep {
    stepNumber: number;
    type: ThoughtType;
    reasoning: string;
    action: string;
    toolCalled?: string;
    toolArgs?: string;
    result?: string;
    status: ThoughtStatus;
    duration: number;
    tokensUsed: number;
    startTime: Date;
    endTime?: Date;
    confidence?: number;
    children?: ThoughtStep[];
    branchLabel?: string;
    loopDetected?: boolean;
}

export interface TaskFlow {
    id: string;
    agentId: string;
    agentName: string;
    agentType: AgentType;
    model: string;
    userPrompt: string;
    systemContext?: string;
    thoughts: ThoughtStep[];
    finalResponse?: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    totalDuration: number;
    totalTokens: number;
    totalCost: number;
    startTime: Date;
    endTime?: Date;
    tags?: string[];
    loopCount: number;
    maxDepth: number;
    toolsUsed: string[];
}

export interface TaskFlowSummary {
    totalFlows: number;
    activeFlows: number;
    completedFlows: number;
    failedFlows: number;
    avgSteps: number;
    avgDuration: number;
    loopDetections: number;
    avgTokensPerFlow: number;
    totalCost: number;
}

// ============================================
// Visualization & UI Models
// ============================================

export interface NetworkNode {
    id: string;
    name: string;
    type: 'orchestrator' | 'goal' | 'uclam' | 'researcher' | 'scorer' | 'writer' | 'coder' | 'reviewer';
    x: number;
    y: number;
    status: 'active' | 'idle' | 'processing' | 'error';
    model?: string;
}

export interface NetworkConnection {
    id: string;
    from: string;
    to: string;
    active: boolean;
}

export interface SystemMetrics {
    tokenCount: number;
    maxTokens: number;
    totalCost: number;
    contextUsed: number;
    contextTotal: number;
}

// ============================================
// Cost Optimization Models
// ============================================

export interface CostBreakdown {
    modelName: string;
    requestCount: number;
    tokensUsed: number;
    cost: number;
}

export interface CostRecommendation {
    id: string;
    suggestion: string;
    potentialSavings: number;
    type: 'model_switch' | 'caching' | 'prompt_reduction' | 'batching';
    priority: 'high' | 'medium' | 'low';
}

export interface CostAnalysis {
    agentId: string;
    period: 'hour' | 'day' | 'week' | 'month';
    totalCost: number;
    breakdown: CostBreakdown[];
    recommendations: CostRecommendation[];
    projectedCost: number;
    budgetLimit: number;
    budgetUtilization: number;
}

