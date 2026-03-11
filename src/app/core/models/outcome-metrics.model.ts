/**
 * Outcome-Based Metrics Models
 * Business Intelligence layer for tracking success, SLA compliance, and goal achievement
 */

// ============================================
// Task Outcome
// ============================================

/**
 * Business impact classification
 */
export type BusinessImpact = 'high' | 'medium' | 'low';

/**
 * Task completion quality rating
 */
export type QualityRating = 'excellent' | 'good' | 'acceptable' | 'poor';

/**
 * User satisfaction score (1-5 stars)
 */
export type SatisfactionScore = 1 | 2 | 3 | 4 | 5;

/**
 * TaskOutcome - Business-level result of an agent execution
 * Correlates with AgentExecution via executionId
 */
export interface TaskOutcome {
    id: string;                           // Unique outcome ID
    executionId: string;                  // References AgentExecution.id
    taskName: string;                     // Business task name
    agentId: string;
    agentName: string;

    // Success Metrics
    success: boolean;                     // Did task complete successfully?
    completionScore: number;              // 0-100 (how complete is the result?)
    qualityScore: number;                 // 0-10 (how good is the output?)
    qualityRating: QualityRating;
    userSatisfaction?: SatisfactionScore; // Optional user feedback

    // Business Value
    businessImpact: BusinessImpact;       // Strategic importance
    businessValue: number;                // Calculated weighted value (0-100)
    costEfficiency: number;               // Value/Cost ratio

    // SLA Compliance
    actualDuration: number;               // ms
    slaTarget?: number;                   // ms (if defined for this task type)
    slaMet: boolean;                      // Did we meet SLA?
    slaMargin: number;                    // How close? (positive = under, negative = over)

    // Timing
    startTime: Date;
    endTime: Date;

    // Cost
    cost: number;                         // USD
    tokensUsed: number;

    // Errors
    errorMessage?: string;
    errorCategory?: 'timeout' | 'quality' | 'validation' | 'system' | 'user_cancel';

    // Metadata
    tags?: string[];
    metadata?: Record<string, any>;
}

// ============================================
// SLA Definitions
// ============================================

/**
 * SLA metric type
 */
export type SlaMetricType = 'response_time' | 'completion_rate' | 'quality_score' | 'uptime' | 'cost_per_task';

/**
 * SLA Definition - Service Level Agreement targets
 */
export interface SLADefinition {
    id: string;
    name: string;                         // e.g., "Research Task Response Time"
    metricType: SlaMetricType;
    target: number;                       // Target value (depends on metricType)
    unit: string;                         // e.g., "ms", "%", "score", "USD"

    // Thresholds
    criticalThreshold: number;            // Red alert threshold
    warningThreshold: number;             // Yellow warning threshold

    // Scope
    appliesToAgents?: string[];           // If undefined, applies to all
    appliesToTaskTypes?: string[];

    // Status
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * SLA Compliance Result
 */
export interface SLACompliance {
    slaId: string;
    slaName: string;
    metricType: SlaMetricType;
    target: number;
    actual: number;
    unit: string;

    // Compliance
    met: boolean;
    percentage: number;                   // % of target achieved (100% = exactly met)
    status: 'critical' | 'warning' | 'healthy';

    // Trends
    trend: 'improving' | 'stable' | 'degrading';
    previousValue?: number;

    // Violations
    violationCount: number;               // # breaches in current period
    lastViolation?: Date;
}

// ============================================
// Goal Tracking
// ============================================

/**
 * Goal status
 */
export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed';

/**
 * GoalTracker - High-level business objective
 */
export interface GoalTracker {
    id: string;
    name: string;                         // e.g., "Q1 2024: Reduce avg response time to <2s"
    description: string;

    // Target
    targetMetric: string;                 // What we're measuring
    targetValue: number;                  // What we want to achieve
    currentValue: number;                 // Where we are now
    unit: string;                         // Measurement unit

    // Progress
    progress: number;                     // 0-100%
    status: GoalStatus;

    // Timeline
    startDate: Date;
    targetDate: Date;
    completedDate?: Date;

    // Ownership
    owner?: string;                       // Team/person responsible
    priority: 'low' | 'medium' | 'high' | 'critical';

    // Milestones
    milestones?: GoalMilestone[];

    // Metadata
    tags?: string[];
    notes?: string;
}

/**
 * Goal Milestone - Checkpoint within a goal
 */
export interface GoalMilestone {
    id: string;
    name: string;
    targetValue: number;
    targetDate: Date;
    completed: boolean;
    completedDate?: Date;
}

// ============================================
// Aggregated Metrics
// ============================================

/**
 * OutcomeMetricsSummary - Aggregated business intelligence
 */
export interface OutcomeMetricsSummary {
    // Overview
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    successRate: number;                  // %

    // Quality
    avgCompletionScore: number;           // 0-100
    avgQualityScore: number;              // 0-10
    avgUserSatisfaction: number;          // 1-5

    // Business Value
    totalBusinessValue: number;           // Sum of all weighted values
    avgBusinessValue: number;
    highImpactTasks: number;

    // SLA Performance
    slaComplianceRate: number;            // % of tasks meeting SLA
    avgSlaMargin: number;                 // How much buffer (ms)
    slaViolations: number;

    // Cost Efficiency
    totalCost: number;                    // USD
    avgCostPerTask: number;
    avgCostEfficiency: number;            // Value/Cost ratio

    // Timing
    avgDuration: number;                  // ms
    p95Duration: number;                  // 95th percentile

    // Period
    periodStart: Date;
    periodEnd: Date;
}

/**
 * Outcome Trend Point - Time series data
 */
export interface OutcomeTrendPoint {
    timestamp: Date;
    successRate: number;
    avgQualityScore: number;
    slaComplianceRate: number;
    businessValue: number;
}

/**
 * Business Impact Breakdown - Distribution by impact level
 */
export interface BusinessImpactBreakdown {
    name: string;                         // 'high' | 'medium' | 'low'
    value: number;                        // Count or sum
    percentage: number;                   // % of total
    color: string;                        // For charts
}

// ============================================
// Helper Types
// ============================================

/**
 * Outcome filter criteria
 */
export interface OutcomeFilter {
    agentIds?: string[];
    success?: boolean;
    businessImpact?: BusinessImpact[];
    slaMet?: boolean;
    startDate?: Date;
    endDate?: Date;
    minQualityScore?: number;
    tags?: string[];
}

/**
 * Outcome sort options
 */
export type OutcomeSortField = 'startTime' | 'duration' | 'qualityScore' | 'businessValue' | 'cost';
export type OutcomeSortOrder = 'asc' | 'desc';

/**
 * Business value weights
 */
export const BusinessValueWeights: Record<BusinessImpact, number> = {
    high: 100,
    medium: 60,
    low: 30
};

/**
 * Quality rating thresholds
 */
export const QualityThresholds = {
    excellent: 9,   // 9-10
    good: 7,        // 7-8.9
    acceptable: 5,  // 5-6.9
    poor: 0         // 0-4.9
} as const;
