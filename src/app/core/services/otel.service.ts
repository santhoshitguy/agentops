import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {
    OtelTrace,
    OtelSpan,
    OtelEvent,
    SpanWaterfallItem,
    TraceSummary,
    SpanKind,
    SpanStatusCode,
    TraceStatus,
    OTLPExportTrace,
    OtelAttributes,
    OtelEvents
} from '../models/otel.model';
import { AgentExecution } from '../models/agent.model';
import { AgentStore } from '../store/agent.store';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';

@Injectable({
    providedIn: 'root'
})
export class OtelService {
    private agentStore = inject(AgentStore);
    private readonly seedData = inject(SeedDataService);
    private readonly dataMode = inject(DataModeService);
    private processedExecutionIds = new Set<string>();

    // ============================================
    // State Signals
    // ============================================
    private readonly _traces = signal<OtelTrace[]>(this.seedData.getTraces());
    private readonly _selectedTraceId = signal<string | null>(null);

    // Public readonly signals
    readonly traces = this._traces.asReadonly();
    readonly selectedTraceId = this._selectedTraceId.asReadonly();

    constructor() {
        effect(() => {
            const executions = this.agentStore.executions();
            const newExecutions = executions.filter(
                e => !this.processedExecutionIds.has(e.id)
            );

            newExecutions.forEach(exec => {
                const trace = this.mapExecutionToTrace(exec);
                this._traces.update(traces => [...traces, trace]);
                this.processedExecutionIds.add(exec.id);
            });
        }, { allowSignalWrites: true });

        effect(() => {
            if (this.dataMode.isMock()) {
                this._traces.set(this.seedData.getTraces());
            }
        }, { allowSignalWrites: true });
    }

    // ============================================
    // Computed Signals
    // ============================================

    /**
     * Selected trace object
     */
    readonly selectedTrace = computed(() => {
        const id = this._selectedTraceId();
        if (!id) return null;
        return this._traces().find(t => t.traceId === id) ?? null;
    });

    /**
     * Span waterfall for selected trace
     * - Flattens the span tree
     * - Calculates depth, positions, and widths
     * - Sorts by startTime for chronological rendering
     */
    readonly spanWaterfall = computed((): SpanWaterfallItem[] => {
        const trace = this.selectedTrace();
        if (!trace) return [];

        const traceDuration = trace.duration;
        const traceStart = trace.startTime.getTime();

        // Build parent-child map
        const childrenMap = new Map<string, OtelSpan[]>();
        trace.spans.forEach(span => {
            const parentId = span.parentSpanId ?? 'ROOT';
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId)!.push(span);
        });

        // Recursive function to build waterfall items
        const buildWaterfall = (span: OtelSpan, depth: number): SpanWaterfallItem[] => {
            const spanStart = span.startTime.getTime();
            const spanDuration = span.duration;

            // Calculate percentages
            const leftPercent = ((spanStart - traceStart) / traceDuration) * 100;
            const widthPercent = (spanDuration / traceDuration) * 100;

            const item: SpanWaterfallItem = {
                span,
                depth,
                leftPercent: Math.max(0, Math.min(100, leftPercent)),
                widthPercent: Math.max(0.5, Math.min(100, widthPercent)), // Minimum 0.5% visibility
                indentPx: depth * 20,
                durationFormatted: this.formatDuration(spanDuration),
                hasChildren: childrenMap.has(span.spanId),
                isExpanded: true
            };

            const result: SpanWaterfallItem[] = [item];

            // Recursively add children
            const children = childrenMap.get(span.spanId) || [];
            children
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .forEach(child => {
                    result.push(...buildWaterfall(child, depth + 1));
                });

            return result;
        };

        return buildWaterfall(trace.rootSpan, 0);
    });

    /**
     * Trace summaries for list view
     */
    readonly traceSummaries = computed((): TraceSummary[] => {
        return this._traces().map(trace => ({
            traceId: trace.traceId,
            name: trace.name,
            status: trace.status,
            duration: trace.duration,
            spanCount: trace.spanCount,
            errorCount: trace.errorCount,
            startTime: trace.startTime,
            agentName: trace.agentName,
            totalCost: trace.totalCost
        }));
    });

    /**
     * Trace count by status
     */
    readonly traceStats = computed(() => {
        const traces = this._traces();
        return {
            total: traces.length,
            success: traces.filter(t => t.status === 'success').length,
            error: traces.filter(t => t.status === 'error').length,
            inProgress: traces.filter(t => t.status === 'in_progress').length,
            avgDuration: traces.length > 0
                ? traces.reduce((sum, t) => sum + t.duration, 0) / traces.length
                : 0,
            totalCost: traces.reduce((sum, t) => sum + (t.totalCost ?? 0), 0)
        };
    });

    // ============================================
    // Public Methods
    // ============================================

    /**
     * Add a new trace
     */
    addTrace(trace: OtelTrace): void {
        this._traces.update(traces => [...traces, trace]);
    }

    /**
     * Select a trace for detailed view
     */
    selectTrace(traceId: string | null): void {
        this._selectedTraceId.set(traceId);
    }

    /**
     * Clear all traces
     */
    clearTraces(): void {
        this._traces.set([]);
        this._selectedTraceId.set(null);
    }

    /**
     * Map AgentExecution to OtelTrace
     * Converts agent executions into OpenTelemetry trace structures
     */
    mapExecutionToTrace(execution: AgentExecution): OtelTrace {
        const traceId = this.generateTraceId();
        const rootSpanId = this.generateSpanId();

        // Create root span for the execution
        const rootSpan: OtelSpan = {
            spanId: rootSpanId,
            traceId,
            parentSpanId: null,
            name: `agent.execute.${execution.agentName}`,
            kind: 'SERVER' as SpanKind,
            startTime: execution.startTime,
            endTime: execution.endTime ?? new Date(),
            duration: execution.endTime
                ? execution.endTime.getTime() - execution.startTime.getTime()
                : Date.now() - execution.startTime.getTime(),
            status: {
                code: execution.status === 'failed' ? 'ERROR' : 'OK',
                message: execution.errorMessage
            },
            attributes: {
                [OtelAttributes.AGENT_ID]: execution.agentId,
                [OtelAttributes.AGENT_NAME]: execution.agentName,
                [OtelAttributes.EXECUTION_ID]: execution.id,
                [OtelAttributes.EXECUTION_STATUS]: execution.status,
                [OtelAttributes.EXECUTION_TOKENS]: execution.tokensUsed,
                [OtelAttributes.EXECUTION_COST]: execution.cost
            },
            events: [],
            depth: 0
        };

        // Create child spans for tool calls from all steps
        const childSpans: OtelSpan[] = [];
        execution.steps.forEach((step) => {
            if (step.toolCalls && step.toolCalls.length > 0) {
                step.toolCalls.forEach((toolCall) => {
                    const toolSpanId = this.generateSpanId();
                    const toolStart = step.startTime;
                    const toolEnd = step.endTime ?? new Date(step.startTime.getTime() + toolCall.duration);

                    childSpans.push({
                        spanId: toolSpanId,
                        traceId,
                        parentSpanId: rootSpanId,
                        name: `tool.${toolCall.tool}`,
                        kind: 'CLIENT' as SpanKind,
                        startTime: toolStart,
                        endTime: toolEnd,
                        duration: toolCall.duration,
                        status: {
                            code: toolCall.success ? 'OK' : 'ERROR',
                            message: toolCall.success ? undefined : 'Tool call failed'
                        },
                        attributes: {
                            [OtelAttributes.TOOL_NAME]: toolCall.tool,
                            [OtelAttributes.TOOL_RESULT]: toolCall.result?.substring(0, 100) ?? ''
                        },
                        events: [
                            {
                                name: OtelEvents.TOOL_CALL_START,
                                timestamp: toolStart
                            },
                            {
                                name: OtelEvents.TOOL_CALL_END,
                                timestamp: toolEnd
                            }
                        ],
                        depth: 1
                    });
                });
            }
        });

        const allSpans = [rootSpan, ...childSpans];

        const trace: OtelTrace = {
            traceId,
            name: `${execution.agentName} Execution`,
            rootSpan,
            spans: allSpans,
            status: this.deriveTraceStatus(execution.status),
            startTime: execution.startTime,
            endTime: execution.endTime ?? new Date(),
            duration: rootSpan.duration,
            spanCount: allSpans.length,
            errorCount: allSpans.filter(s => s.status.code === 'ERROR').length,
            totalCost: execution.cost,
            agentId: execution.agentId,
            agentName: execution.agentName,
            executionId: execution.id,
            resource: {
                serviceName: 'agentops-ai',
                serviceVersion: '1.0.0',
                environment: 'production'
            }
        };

        return trace;
    }

    /**
     * Export traces in OTLP format
     * Compatible with Jaeger, Honeycomb, Datadog, etc.
     */
    exportTraces(): OTLPExportTrace {
        const traces = this._traces();

        return {
            resourceSpans: traces.map(trace => ({
                resource: {
                    attributes: [
                        { key: 'service.name', value: { stringValue: trace.resource?.serviceName ?? 'agentops-ai' } },
                        { key: 'service.version', value: { stringValue: trace.resource?.serviceVersion ?? '1.0.0' } }
                    ]
                },
                scopeSpans: [{
                    scope: {
                        name: 'agentops-ai',
                        version: '1.0.0'
                    },
                    spans: trace.spans.map(span => ({
                        traceId: span.traceId,
                        spanId: span.spanId,
                        parentSpanId: span.parentSpanId ?? undefined,
                        name: span.name,
                        kind: this.spanKindToNumber(span.kind),
                        startTimeUnixNano: (span.startTime.getTime() * 1_000_000).toString(),
                        endTimeUnixNano: (span.endTime.getTime() * 1_000_000).toString(),
                        attributes: Object.entries(span.attributes).map(([key, value]) => ({
                            key,
                            value: { stringValue: String(value) }
                        })),
                        status: {
                            code: span.status.code === 'OK' ? 1 : span.status.code === 'ERROR' ? 2 : 0,
                            message: span.status.message
                        },
                        events: span.events.map(event => ({
                            name: event.name,
                            timeUnixNano: (event.timestamp.getTime() * 1_000_000).toString(),
                            attributes: event.attributes
                                ? Object.entries(event.attributes).map(([key, value]) => ({
                                    key,
                                    value: { stringValue: String(value) }
                                }))
                                : []
                        }))
                    }))
                }]
            }))
        };
    }

    /**
     * Generate mock traces for demo purposes
     */
    generateMockTraces(count: number): OtelTrace[] {
        return this.seedData.getTraces().slice(0, count);
    }

    // ============================================
    // Helper Methods
    // ============================================

    private generateTraceId(): string {
        return Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    private generateSpanId(): string {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    private formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms.toFixed(0)}ms`;
        }
        return `${(ms / 1000).toFixed(2)}s`;
    }

    private deriveTraceStatus(executionStatus: string): TraceStatus {
        switch (executionStatus) {
            case 'completed': return 'success';
            case 'failed': return 'error';
            case 'executing':
            case 'planning':
            case 'initializing': return 'in_progress';
            default: return 'error';
        }
    }

    private spanKindToNumber(kind: SpanKind): number {
        const mapping: Record<SpanKind, number> = {
            'INTERNAL': 0,
            'SERVER': 1,
            'CLIENT': 2,
            'PRODUCER': 3,
            'CONSUMER': 4
        };
        return mapping[kind] ?? 0;
    }
}
