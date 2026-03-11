import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { AuditService } from './audit.service';
import { AlertService } from './alert.service';
import { OtelService } from './otel.service';
import { AgentStore } from '../store/agent.store';
import {
    AuditLogEntry,
    CompliancePolicy,
    DataAccessRecord,
    RiskFactor,
    RiskScore,
    HeatmapCell
} from '../models/compliance.model';
import { AuditEvent, AuditEventType } from '../models/audit.model';
import { Alert } from '../models/alert.model';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';

@Injectable({
    providedIn: 'root'
})
export class ComplianceService {
    private readonly seedData = inject(SeedDataService);
  private readonly dataMode = inject(DataModeService);
    private readonly auditService = inject(AuditService);
    private readonly alertService = inject(AlertService);
    private readonly otelService = inject(OtelService); // For linking trace status
    private readonly agentStore = inject(AgentStore);

    private processedExecutionIds = new Set<string>();

    // ============================================
    // State Signals
    // ============================================

    // Immutable Audit Log (Local overlay on AuditService or standalone)
    // We subscribe to AuditService to build our compliance view, or we push to it.
    // Given the prompt "addAuditEntry", we act as the facade.
    private readonly _complianceLogs = signal<AuditLogEntry[]>(this.seedData.getAuditLogEntries());

    // Active Policies
    private readonly _policies = signal<CompliancePolicy[]>(this.initializeDefaultPolicies());

    // Risk Factors
    private readonly _riskFactors = signal<RiskFactor[]>(this.initializeRiskFactors());

    // ============================================
    // Computed Signals
    // ============================================

    readonly complianceLogs = this._complianceLogs.asReadonly();
    readonly activePolicies = this._policies.asReadonly();

    /**
     * Data Access Heatmap
     * Aggregates access patterns by Agent and Data Source.
     * Logic: Uses a Map<AgentId, Map<SourceId, Cell>> to avoid sparse matrix.
     */
    readonly heatmapData = computed<HeatmapCell[]>(() => {
        const logs = this._complianceLogs();
        const map = new Map<string, Map<string, HeatmapCell>>();

        // Time window for heatmap (e.g., last 24 hours or all logs)
        // For now, using all logs for demo
        for (const log of logs) {
            // Filter only relevant data access events
            if (!this.isDataAccessEvent(log)) continue;

            const agentId = log.userId; // Assuming userId maps to agentId in this context
            const sourceId = `${log.resourceType}:${log.resourceId}`;

            if (!map.has(agentId)) {
                map.set(agentId, new Map());
            }

            const agentRow = map.get(agentId)!;
            if (!agentRow.has(sourceId)) {
                agentRow.set(sourceId, {
                    agentId,
                    dataSourceId: sourceId,
                    accessCount: 0,
                    errorCount: 0,
                    riskLevel: 0
                });
            }

            const cell = agentRow.get(sourceId)!;
            cell.accessCount++;
            if (log.status === 'failure') cell.errorCount++;

            // Normalize risk contribution (simple heuristic)
            if (log.severity === 'critical') cell.riskLevel += 0.5;
            if (log.severity === 'warning') cell.riskLevel += 0.2;
        }

        // Flatten map to list
        const cells: HeatmapCell[] = [];
        for (const row of map.values()) {
            for (const cell of row.values()) {
                // Normalize cell risk level to 0-1
                cell.riskLevel = Math.min(1, cell.riskLevel);
                cells.push(cell);
            }
        }
        return cells;
    });

    /**
     * Overall Risk Score (0-100)
     */
    readonly riskScore = computed<RiskScore>(() => {
        const factors = this._riskFactors();

        // Calculate weighted average
        let totalWeight = 0;
        let totalScore = 0;

        for (const factor of factors) {
            totalScore += factor.value * factor.weight;
            totalWeight += factor.weight;
        }

        const overall = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

        return {
            overallScore: overall,
            level: this.getRiskLevel(overall),
            factors,
            trend: this.calculateTrend(factors), // Simplified trend
            timestamp: new Date()
        };
    });

    constructor() {
        // Generate mock traces for linking demonstration
        this.otelService.generateMockTraces(50);

        effect(() => {
      if (this.dataMode.isMock()) {
        this._complianceLogs.set(this.seedData.getAuditLogEntries());
      }
    });

        // Sync with AuditService to populate initial state if needed
        this.initializeMockData();

        // Auto-create Audit Logs from Agent Executions (Providence Chain)
        effect(() => {
            const executions = this.agentStore.executions();
            const traces = this.otelService.traces();

            executions.forEach(exec => {
                // We only audit completed or failed tasks
                if (exec.status !== 'completed' && exec.status !== 'failed') return;

                // Prevent duplicate logging
                if (this.processedExecutionIds.has(exec.id)) return;

                // Attempt to link with OTel Trace
                const trace = traces.find(t => t.executionId === exec.id);

                // If trace exists, proceed. If not, we wait for the next effect run (when traces update)
                // This ensures we always have the Providence Link
                if (trace) {
                    this.processedExecutionIds.add(exec.id);

                    const isSuccess = exec.status === 'completed';

                    this.addAuditEntry({
                        type: isSuccess ? 'task_completed' : 'task_failed',
                        category: 'task_execution',
                        action: isSuccess ? `Task Completed: ${exec.taskName}` : 'Task Failed',
                        status: isSuccess ? 'success' : 'failure',
                        userId: exec.agentId,
                        userName: exec.agentName || 'Unknown Agent',
                        userRole: 'AI Agent',
                        resourceType: 'task',
                        resourceId: exec.taskId || exec.id,
                        traceId: trace.traceId, // The Critical Link
                        severity: isSuccess ? 'info' : 'warning',
                        sensitivityLevel: 'internal',
                        complianceFlags: [],
                        piiRedacted: false,
                        ipAddress: '10.0.0.1',
                        userAgent: 'AgentOps/Orchestrator',
                        metadata: {
                            executionId: exec.id,
                            tokensUsed: exec.tokensUsed,
                            cost: exec.cost,
                            model: exec.model
                        }
                    });
                }
            });
        }, { allowSignalWrites: true });
    }

    // ============================================
    // Core Methods
    // ============================================

    /**
     * Add an immutable Audit Entry
     * 1. Evaluates Policies
     * 2. Calculates Risk for Entry
     * 3. Persists to Log
     * 4. Integrates with AlertService
     */
    addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'riskScore' | 'policyViolations'>): void {
        const now = new Date();
        const baseEntry: AuditLogEntry = {
            ...entry,
            id: `audit-${now.getTime()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: now,
            riskScore: 0, // Will update
            policyViolations: []
        };

        // 1. Policy Evaluation
        const violations = this.evaluatePolicies(baseEntry);
        const violationIds = violations.map(v => v.id);

        // 2. Risk Calculation for this specific entry
        const entryRisk = this.calculateEntryRisk(baseEntry, violations);
        const critical = entryRisk > 80;

        const finalEntry: AuditLogEntry = {
            ...baseEntry,
            policyViolations: violationIds,
            riskScore: entryRisk,
            severity: critical ? 'critical' : (violations.length > 0 ? 'warning' : entry.severity)
        };

        // 3. Update State (Immutable add)
        this._complianceLogs.update(logs => [finalEntry, ...logs]);

        // Also sync to lower-level AuditService for system-wide visibility
        this.auditService.logEvent(finalEntry);

        // 4. Update Global Risk Factors based on this new event
        this.updateRiskFactors(finalEntry, violations);

        // 5. Trigger Alert if Critical
        if (critical || violations.some(p => p.severity === 'critical')) {
            this.triggerViolationAlert(finalEntry, violations);
        }
    }

    /**
     * Called by ErrorDebuggerService when the hallucination rate changes.
     * Converts the raw 0-1 rate into a 0-100 risk value for the hallucination factor,
     * fires an alert when the rate crosses the critical threshold, and optionally
     * appends a compliance audit entry.
     */
    updateHallucinationRisk(rate: number, hallucinationCount: number): void {
        const riskValue = Math.round(rate * 100); // 0.18 → 18


        // Update the hallucination risk factor
        this._riskFactors.update(factors =>
            factors.map(f =>
                f.id === 'hallucination-rate'
                    ? { ...f, value: riskValue, lastUpdated: new Date() }
                    : f
            )
        );

        // Fire critical alert when rate exceeds 15%
        if (rate > 0.15) {
            const alertId = `alert-hallucination-compliance-${Math.floor(Date.now() / 60000)}`; // 1-per-minute dedup
            const alreadyFired = this.alertService.alerts().some(a => a.id === alertId);
            if (!alreadyFired) {
                this.alertService.addAlert({
                    id: alertId,
                    type: 'failure_spike',
                    severity: rate > 0.25 ? 'critical' : 'warning',
                    title: 'High Hallucination Rate Detected',
                    message: `Agent hallucination rate reached ${(rate * 100).toFixed(1)}% (${hallucinationCount} events). Compliance risk score elevated.`,
                    timestamp: new Date(),
                    acknowledged: false,
                    relatedEntityType: 'agent'
                });
            }
        }
    }

    private evaluatePolicies(entry: AuditLogEntry): CompliancePolicy[] {
        return this._policies().filter(p => p.enabled && p.condition(entry));
    }

    private calculateEntryRisk(entry: AuditLogEntry, violations: CompliancePolicy[]): number {
        let score = 0;
        if (entry.severity === 'critical') score += 50;
        if (entry.severity === 'warning') score += 20;

        // Add policy weights
        for (const v of violations) {
            score += v.severity === 'critical' ? 40 : v.severity === 'high' ? 25 : 10;
        }

        return Math.min(100, score);
    }

    private triggerViolationAlert(entry: AuditLogEntry, violations: CompliancePolicy[]) {
        const alert: Alert = {
            id: `alert-compliance-${Date.now()}`,
            timestamp: new Date(),
            type: 'custom',
            severity: 'critical',
            title: 'Compliance Violation Detected',
            message: `Event '${entry.action}' violated ${violations.length} policies: ${violations.map(v => v.name).join(', ')}`,
            acknowledged: false,
            relatedEntityId: entry.id,
            relatedEntityType: 'audit'
        };
        this.alertService.addAlert(alert);
    }

    // ============================================
    // Helpers
    // ============================================

    private updateRiskFactors(entry: AuditLogEntry, violations: CompliancePolicy[]) {
        this._riskFactors.update(factors => {
            return factors.map(f => {
                if (f.id === 'policy-adherence') {
                    // Reduce value on violation, recover slowly
                    const penalty = violations.length * 10;
                    const newValue = Math.max(0, Math.min(100, f.value + (violations.length > 0 ? penalty : -1))); // Higher is riskier
                    return { ...f, value: newValue, lastUpdated: new Date() };
                }
                if (f.id === 'data-access') {
                    if (entry.type === 'data_accessed') {
                        return { ...f, value: Math.min(100, f.value + 1), lastUpdated: new Date() };
                    } else {
                        return { ...f, value: Math.max(0, f.value - 0.1), lastUpdated: new Date() }; // Decay
                    }
                }
                return f;
            });
        });
    }

    private isDataAccessEvent(log: AuditLogEntry): boolean {
        return log.type.includes('data') || log.category === 'data_operations';
    }

    private getRiskLevel(score: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
        if (score < 20) return 'safe';
        if (score < 40) return 'low';
        if (score < 60) return 'medium';
        if (score < 80) return 'high';
        return 'critical';
    }

    private calculateTrend(factors: RiskFactor[]): 'up' | 'down' | 'stable' {
        // Simplified trend logic
        return 'stable';
    }

    // ============================================
    // Initialization
    // ============================================

    private initializeDefaultPolicies(): CompliancePolicy[] {
        return [
            {
                id: 'pol-gdpr-1',
                name: 'GDPR Data Purpose',
                description: 'Personal data usage must be authorized',
                framework: 'gdpr',
                severity: 'high',
                enabled: true,
                condition: (e) => e.type === 'data_accessed' && e.sensitivityLevel === 'confidential' && !e.userName.includes('DPO'),
                created: new Date(),
                lastUpdated: new Date()
            },
            {
                id: 'pol-soc2-access',
                name: 'SOC2 Access Control',
                description: 'Failed access attempts must be logged',
                framework: 'soc2',
                severity: 'medium',
                enabled: true,
                condition: (e) => e.status === 'failure' && e.category === 'authentication',
                created: new Date(),
                lastUpdated: new Date()
            },
            {
                id: 'pol-hallucination-integrity',
                name: 'Agent Output Integrity',
                description: 'Hallucinated agent outputs represent a compliance integrity risk',
                framework: 'soc2',
                severity: 'high',
                enabled: true,
                condition: (e) => e.type === 'task_failed' && e.metadata?.['hallucinationDetected'] === true,
                created: new Date(),
                lastUpdated: new Date()
            }
        ];
    }

    private initializeRiskFactors(): RiskFactor[] {
        return [
            { id: 'policy-adherence', name: 'Policy Compliance', description: 'Rate of policy violations', weight: 0.35, value: 10, source: 'policy', lastUpdated: new Date() },
            { id: 'data-access', name: 'Data Access Velocity', description: 'Frequency of sensitive data access', weight: 0.25, value: 25, source: 'anomaly', lastUpdated: new Date() },
            { id: 'agent-integrity', name: 'Agent Integrity', description: 'Unexpected agent behaviors', weight: 0.25, value: 5, source: 'anomaly', lastUpdated: new Date() },
            { id: 'hallucination-rate', name: 'Hallucination Rate', description: 'Frequency of agent hallucinations vs total errors', weight: 0.15, value: 0, source: 'anomaly', lastUpdated: new Date() }
        ];
    }

    private initializeMockData() {
        const agents = ['agent-researcher', 'agent-coder', 'agent-reviewer'];
        const sources = ['db-users', 's3-logs', 'api-stripe', 'internal-wiki'];
        const traces = this.otelService.traces();

        // Generate 20 random entries
        const entries: AuditLogEntry[] = [];
        for (let i = 0; i < 20; i++) {
            const agent = agents[Math.floor(Math.random() * agents.length)];
            const source = sources[Math.floor(Math.random() * sources.length)];
            const failed = Math.random() > 0.8;
            const trace = traces.length > 0 ? traces[i % traces.length] : undefined;

            entries.push({
                id: `audit-${i}`,
                traceId: trace?.traceId,
                timestamp: new Date(Date.now() - Math.random() * 86400000),
                type: 'data_accessed',
                severity: failed ? 'warning' : 'info',
                category: 'data_operations',
                userId: agent,
                userName: agent.replace('agent-', 'Agent '),
                userRole: 'System',
                ipAddress: '10.0.0.1',
                userAgent: 'Bot/1.0',
                resourceType: source.split('-')[0],
                resourceId: source,
                action: failed ? 'Failed access attempt' : 'Accessed record batch',
                status: failed ? 'failure' : 'success',
                sensitivityLevel: 'confidential',
                complianceFlags: ['gdpr'],
                piiRedacted: true,
                riskScore: failed ? 45 : 10,
                policyViolations: []
            });
        }
        this._complianceLogs.set(entries);
    }
}
