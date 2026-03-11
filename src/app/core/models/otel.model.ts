/**
 * OpenTelemetry Data Models
 * Aligned with OTLP (OpenTelemetry Protocol) standards
 * https://opentelemetry.io/docs/specs/otel/trace/api/
 */

// ============================================
// Enums and Types
// ============================================

/**
 * Span Kind - Indicates the relationship of the span to its parent
 * https://opentelemetry.io/docs/specs/otel/trace/api/#spankind
 */
export type SpanKind =
    | 'INTERNAL'      // Default - internal operation
    | 'SERVER'        // Server handling a request
    | 'CLIENT'        // Client making a request
    | 'PRODUCER'      // Message producer
    | 'CONSUMER';     // Message consumer

/**
 * Span Status Code
 */
export type SpanStatusCode =
    | 'UNSET'         // Default - no explicit status
    | 'OK'            // Operation completed successfully
    | 'ERROR';        // Operation failed

/**
 * Trace Status - Overall trace health
 */
export type TraceStatus = 'success' | 'error' | 'in_progress' | 'timeout';

// ============================================
// Core Span Structure
// ============================================

/**
 * OpenTelemetry Span
 * Represents a single unit of work within a trace
 */
export interface OtelSpan {
    spanId: string;                           // Unique span identifier (16-char hex)
    traceId: string;                          // Parent trace ID
    parentSpanId: string | null;              // Parent span ID (null for root)
    name: string;                             // Operation name (e.g., "agent.execute", "tool.search")
    kind: SpanKind;                           // Span type
    startTime: Date;                          // Span start timestamp
    endTime: Date;                            // Span end timestamp
    duration: number;                         // Duration in milliseconds

    // Status
    status: {
        code: SpanStatusCode;
        message?: string;                       // Error message if status === 'ERROR'
    };

    // Attributes (semantic conventions)
    attributes: Record<string, string | number | boolean>;

    // Events (logs within the span)
    events: OtelEvent[];

    // Links to other spans (advanced - for correlations)
    links?: OtelLink[];

    // Computed fields (for UI)
    depth?: number;                           // Nesting depth (0 = root)
    children?: OtelSpan[];                    // Child spans (computed)
}

/**
 * Span Event
 * Represents a point-in-time occurrence during a span
 */
export interface OtelEvent {
    name: string;                             // Event name (e.g., "exception", "log")
    timestamp: Date;                          // When it occurred
    attributes?: Record<string, string | number | boolean>;
}

/**
 * Span Link
 * Links this span to another span (e.g., batch processing)
 */
export interface OtelLink {
    traceId: string;
    spanId: string;
    attributes?: Record<string, string | number | boolean>;
}

// ============================================
// Trace Structure
// ============================================

/**
 * OpenTelemetry Trace
 * Represents a complete execution flow (tree of spans)
 */
export interface OtelTrace {
    traceId: string;                          // Unique trace identifier (32-char hex)
    name: string;                             // Trace name (usually root span name)
    rootSpan: OtelSpan;                       // Root span of the trace
    spans: OtelSpan[];                        // All spans (flattened)
    status: TraceStatus;                      // Overall trace status
    startTime: Date;                          // Trace start (root span start)
    endTime: Date;                            // Trace end (latest span end)
    duration: number;                         // Total duration in milliseconds

    // Metrics
    spanCount: number;                        // Total number of spans
    errorCount: number;                       // Number of spans with errors
    totalCost?: number;                       // Optional: Cost tracking

    // Agent-specific metadata
    agentId?: string;                         // Primary agent for this trace
    agentName?: string;
    executionId?: string;                     // Link to AgentExecution

    // Resource attributes (environment info)
    resource?: {
        serviceName: string;                    // e.g., "agentops-ai"
        serviceVersion: string;                 // e.g., "1.0.0"
        environment: string;                    // e.g., "production"
    };
}

// ============================================
// Visualization Models
// ============================================

/**
 * Span Waterfall Item
 * Enhanced span data for Gantt-style rendering
 */
export interface SpanWaterfallItem {
    span: OtelSpan;
    depth: number;                            // Nesting level (0 = root)
    leftPercent: number;                      // CSS left position (0-100)
    widthPercent: number;                     // CSS width (0-100)
    indentPx: number;                         // Left padding based on depth
    durationFormatted: string;                // e.g., "120ms" or "1.2s"
    hasChildren: boolean;
    isExpanded?: boolean;                     // For collapsible tree view
}

/**
 * Trace Summary
 * Aggregated metrics for trace list view
 */
export interface TraceSummary {
    traceId: string;
    name: string;
    status: TraceStatus;
    duration: number;
    spanCount: number;
    errorCount: number;
    startTime: Date;
    agentName?: string;
    totalCost?: number;
}

// ============================================
// OTLP Export Format
// ============================================

/**
 * OTLP-compatible export structure
 * For exporting to Jaeger, Honeycomb, Datadog, etc.
 */
export interface OTLPExportTrace {
    resourceSpans: Array<{
        resource: {
            attributes: Array<{ key: string; value: { stringValue?: string; intValue?: number } }>;
        };
        scopeSpans: Array<{
            scope: {
                name: string;
                version: string;
            };
            spans: Array<{
                traceId: string;
                spanId: string;
                parentSpanId?: string;
                name: string;
                kind: number;                       // Enum as number (INTERNAL=0, SERVER=1, etc.)
                startTimeUnixNano: string;          // Unix timestamp in nanoseconds
                endTimeUnixNano: string;
                attributes: Array<{ key: string; value: unknown }>;
                status: { code: number; message?: string };
                events: Array<{
                    name: string;
                    timeUnixNano: string;
                    attributes?: Array<{ key: string; value: unknown }>;
                }>;
            }>;
        }>;
    }>;
}

// ============================================
// Semantic Conventions
// ============================================

/**
 * Standard attribute keys (semantic conventions)
 * https://opentelemetry.io/docs/specs/semconv/
 */
export const OtelAttributes = {
    // Agent attributes
    AGENT_ID: 'agent.id',
    AGENT_NAME: 'agent.name',
    AGENT_TYPE: 'agent.type',
    AGENT_MODEL: 'agent.model',

    // Execution attributes
    EXECUTION_ID: 'execution.id',
    EXECUTION_STATUS: 'execution.status',
    EXECUTION_TOKENS: 'execution.tokens',
    EXECUTION_COST: 'execution.cost',

    // Tool attributes
    TOOL_NAME: 'tool.name',
    TOOL_RESULT: 'tool.result',
    TOOL_ERROR: 'tool.error',

    // Communication attributes
    MESSAGE_ID: 'message.id',
    MESSAGE_TYPE: 'message.type',
    MESSAGE_FROM: 'message.from',
    MESSAGE_TO: 'message.to',

    // Error attributes
    ERROR_TYPE: 'error.type',
    ERROR_MESSAGE: 'error.message',
    ERROR_STACK: 'error.stack',
} as const;

/**
 * Standard event names
 */
export const OtelEvents = {
    EXCEPTION: 'exception',
    LOG: 'log',
    MESSAGE_SENT: 'message.sent',
    MESSAGE_RECEIVED: 'message.received',
    TOOL_CALL_START: 'tool.call.start',
    TOOL_CALL_END: 'tool.call.end',
    HANDOFF_START: 'handoff.start',
    HANDOFF_END: 'handoff.end',
} as const;
