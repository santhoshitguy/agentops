import { Injectable, signal, computed } from '@angular/core';
import {
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    AuditSearchCriteria,
    AuditSearchResult,
    ComplianceReport,
    ComplianceFramework,
    ComplianceViolation,
    RetentionPolicy,
    PIIDetectionResult,
    PIIPattern,
    DataExportRequest,
    COMPLIANCE_FRAMEWORKS,
    EVENT_TYPE_METADATA
} from '../models/audit.model';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    // ============================================
    // State Signals
    // ============================================

    private readonly _auditEvents = signal<AuditEvent[]>([]);
    private readonly _retentionPolicy = signal<RetentionPolicy | null>(null);
    private readonly _selectedFramework = signal<ComplianceFramework>('gdpr');

    // Public readonly
    readonly auditEvents = this._auditEvents.asReadonly();
    readonly retentionPolicy = this._retentionPolicy.asReadonly();
    readonly selectedFramework = this._selectedFramework.asReadonly();

    // ============================================
    // Computed Signals
    // ============================================

    /**
     * Recent events (last 50)
     */
    readonly recentEvents = computed(() => {
        return this._auditEvents().slice(-50).reverse();
    });

    /**
     * Critical events
     */
    readonly criticalEvents = computed(() => {
        return this._auditEvents().filter(e => e.severity === 'critical');
    });

    /**
     * Event statistics
     */
    readonly eventStats = computed(() => {
        const events = this._auditEvents();

        const byType: Record<string, number> = {};
        const bySeverity: Record<string, number> = { info: 0, warning: 0, critical: 0 };
        const byUser: Record<string, number> = {};

        events.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
            bySeverity[e.severity]++;
            byUser[e.userId] = (byUser[e.userId] || 0) + 1;
        });

        return {
            total: events.length,
            byType,
            bySeverity,
            byUser,
            uniqueUsers: Object.keys(byUser).length
        };
    });

    /**
     * Compliance score (0-100)
     */
    readonly complianceScore = computed(() => {
        const framework = this._selectedFramework();
        const requirements = COMPLIANCE_FRAMEWORKS[framework];
        const events = this._auditEvents();

        if (events.length === 0) return 100;

        // Check required event types are being logged
        const requiredTypes = requirements.requiredEventTypes;
        const loggedTypes = new Set(events.map(e => e.type));
        const typeCoverage = requiredTypes.filter(t => loggedTypes.has(t)).length / requiredTypes.length;

        // Check retention compliance
        const oldestEvent = events[0]?.timestamp;
        const daysSinceOldest = oldestEvent
            ? (Date.now() - oldestEvent.getTime()) / (1000 * 60 * 60 * 24)
            : 0;
        const retentionCompliance = daysSinceOldest <= requirements.requiredRetentionDays ? 1 : 0.5;

        // Check PII redaction
        const redactedCount = events.filter(e => e.piiRedacted).length;
        const redactionRate = events.length > 0 ? redactedCount / events.length : 1;

        // Calculate weighted score
        const score = (
            typeCoverage * 0.4 +
            retentionCompliance * 0.3 +
            redactionRate * 0.3
        ) * 100;

        return Math.round(score);
    });

    // ============================================
    // Constructor
    // ============================================

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData(): void {
        const mockEvents: AuditEvent[] = [];
        const now = new Date();

        // Generate 100 mock audit events over the last 30 days
        const eventTypes: AuditEventType[] = [
            'agent_created', 'task_started', 'task_completed', 'data_accessed',
            'data_modified', 'user_login', 'config_updated', 'api_call'
        ];

        const users = [
            { id: 'u1', name: 'Alex Johnson', role: 'Admin' },
            { id: 'u2', name: 'Sarah Chen', role: 'Operator' },
            { id: 'u3', name: 'Mike Davis', role: 'Analyst' }
        ];

        for (let i = 0; i < 100; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const timestamp = new Date(now);
            timestamp.setDate(timestamp.getDate() - daysAgo);
            timestamp.setHours(Math.floor(Math.random() * 24));
            timestamp.setMinutes(Math.floor(Math.random() * 60));

            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const user = users[Math.floor(Math.random() * users.length)];
            const metadata = EVENT_TYPE_METADATA[eventType];

            mockEvents.push({
                id: `audit-${timestamp.getTime()}-${i}`,
                timestamp,
                type: eventType,
                severity: metadata.defaultSeverity,
                category: metadata.category,
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (Chrome)',
                resourceType: 'agent',
                resourceId: `agent-${Math.floor(Math.random() * 10)}`,
                resourceName: `Agent ${Math.floor(Math.random() * 10)}`,
                action: this.generateActionDescription(eventType),
                status: Math.random() > 0.1 ? 'success' : 'failure',
                sensitivityLevel: Math.random() > 0.7 ? 'confidential' : 'internal',
                complianceFlags: ['gdpr', 'soc2'],
                piiRedacted: Math.random() > 0.5,
                metadata: {
                    duration: Math.floor(Math.random() * 5000),
                    throughput: Math.floor(Math.random() * 100)
                }
            });
        }

        // Sort by timestamp
        mockEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        this._auditEvents.set(mockEvents);

        // Set default retention policy
        this._retentionPolicy.set({
            id: 'policy-1',
            name: 'GDPR Compliant (1 year)',
            enabled: true,
            retentionDays: 365,
            archiveBeforePurge: true,
            executionSchedule: '0 0 1 * *',
            lastExecuted: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            nextExecution: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000)
        });
    }

    private generateActionDescription(type: AuditEventType): string {
        const descriptions: Record<AuditEventType, string> = {
            agent_created: 'Created new AI agent for task processing',
            agent_updated: 'Updated agent configuration and parameters',
            agent_deleted: 'Removed agent from active pool',
            task_started: 'Initiated task execution with specified parameters',
            task_completed: 'Successfully completed task with results',
            task_failed: 'Task execution failed due to error',
            data_accessed: 'Accessed sensitive data for processing',
            data_modified: 'Modified data records in database',
            data_deleted: 'Permanently deleted data records',
            user_login: 'User authenticated and session created',
            user_logout: 'User session terminated',
            permission_changed: 'Modified user permissions and access controls',
            config_updated: 'Updated system configuration settings',
            api_call: 'External API request executed',
            error_occurred: 'System error encountered during operation'
        };

        return descriptions[type] || 'Unknown action';
    }

    // ============================================
    // Audit Logging
    // ============================================

    /**
     * Log a new audit event
     */
    logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
        const auditEvent: AuditEvent = {
            ...event,
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };

        this._auditEvents.update(events => [...events, auditEvent]);
    }

    /**
     * Quick log helper for common events
     */
    quickLog(
        type: AuditEventType,
        userId: string,
        resourceType: string,
        resourceId: string,
        action: string
    ): void {
        const metadata = EVENT_TYPE_METADATA[type];

        this.logEvent({
            type,
            severity: metadata.defaultSeverity,
            category: metadata.category,
            userId,
            userName: 'Current User',
            userRole: 'User',
            ipAddress: '10.0.0.1',
            userAgent: navigator.userAgent,
            resourceType,
            resourceId,
            action,
            status: 'success',
            sensitivityLevel: 'internal',
            complianceFlags: [this._selectedFramework()],
            piiRedacted: false
        });
    }

    // ============================================
    // Search & Filter
    // ============================================

    /**
     * Search audit events
     */
    searchEvents(criteria: AuditSearchCriteria): AuditSearchResult {
        let filtered = this._auditEvents();

        // Time range
        if (criteria.startDate) {
            filtered = filtered.filter(e => e.timestamp >= criteria.startDate!);
        }
        if (criteria.endDate) {
            filtered = filtered.filter(e => e.timestamp <= criteria.endDate!);
        }

        // Event types
        if (criteria.eventTypes && criteria.eventTypes.length > 0) {
            filtered = filtered.filter(e => criteria.eventTypes!.includes(e.type));
        }

        // Severities
        if (criteria.severities && criteria.severities.length > 0) {
            filtered = filtered.filter(e => criteria.severities!.includes(e.severity));
        }

        // Users
        if (criteria.userIds && criteria.userIds.length > 0) {
            filtered = filtered.filter(e => criteria.userIds!.includes(e.userId));
        }

        // Text search
        if (criteria.searchQuery) {
            const query = criteria.searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.action.toLowerCase().includes(query) ||
                e.userName.toLowerCase().includes(query) ||
                e.resourceName?.toLowerCase().includes(query)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const aVal = a[criteria.sortBy];
            const bVal = b[criteria.sortBy];

            if (criteria.sortBy === 'timestamp') {
                const aTime = (aVal as Date).getTime();
                const bTime = (bVal as Date).getTime();
                return criteria.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
            }

            return criteria.sortOrder === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

        // Pagination
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / criteria.pageSize);
        const start = (criteria.page - 1) * criteria.pageSize;
        const end = start + criteria.pageSize;
        const events = filtered.slice(start, end);

        // Aggregations
        const aggregations = {
            byType: this.aggregateBy(filtered, 'type'),
            bySeverity: this.aggregateBy(filtered, 'severity'),
            byUser: this.aggregateBy(filtered, 'userId'),
            byResource: this.aggregateBy(filtered, 'resourceType')
        };

        return {
            events,
            totalCount,
            page: criteria.page,
            pageSize: criteria.pageSize,
            totalPages,
            aggregations
        };
    }

    private aggregateBy(events: AuditEvent[], field: keyof AuditEvent): Record<string, number> {
        return events.reduce((acc, e) => {
            const key = String(e[field]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    // ============================================
    // Compliance Reporting
    // ============================================

    /**
     * Generate compliance report
     */
    generateComplianceReport(
        framework: ComplianceFramework,
        startDate: Date,
        endDate: Date
    ): ComplianceReport {
        const events = this._auditEvents().filter(e =>
            e.timestamp >= startDate &&
            e.timestamp <= endDate &&
            e.complianceFlags.includes(framework)
        );

        const requirements = COMPLIANCE_FRAMEWORKS[framework];
        const stats = this.eventStats();

        // Calculate compliance score
        const score = this.complianceScore();

        // Identify violations
        const violations = this.identifyViolations(framework, events);

        // Generate recommendations
        const recommendations = this.generateRecommendations(framework, events, violations);

        return {
            id: `report-${Date.now()}`,
            generatedAt: new Date(),
            generatedBy: 'System',
            framework,
            startDate,
            endDate,
            totalEvents: events.length,
            eventsByType: stats.byType as any,
            eventsBySeverity: stats.bySeverity as any,
            uniqueUsers: stats.uniqueUsers,
            complianceScore: score,
            violations,
            recommendations,
            eventsRetained: events.length,
            eventsPurged: 0,
            oldestEvent: events[0]?.timestamp
        };
    }

    private identifyViolations(framework: ComplianceFramework, events: AuditEvent[]): ComplianceViolation[] {
        const violations: ComplianceViolation[] = [];

        // Check for failed data access attempts
        const failedAccess = events.filter(e =>
            e.type === 'data_accessed' && e.status === 'failure'
        );

        if (failedAccess.length > 5) {
            violations.push({
                id: `viol-${Date.now()}-1`,
                timestamp: new Date(),
                severity: 'medium',
                rule: `${framework.toUpperCase()} Access Control`,
                description: `${failedAccess.length} failed data access attempts detected`,
                affectedEvents: failedAccess.map(e => e.id),
                remediation: 'Review access permissions and user training',
                status: 'open'
            });
        }

        // Check for unredacted PII
        const unredactedPII = events.filter(e =>
            e.sensitivityLevel === 'confidential' && !e.piiRedacted
        );

        if (unredactedPII.length > 0) {
            violations.push({
                id: `viol-${Date.now()}-2`,
                timestamp: new Date(),
                severity: 'high',
                rule: `${framework.toUpperCase()} Privacy Protection`,
                description: `${unredactedPII.length} events contain unredacted PII`,
                affectedEvents: unredactedPII.map(e => e.id),
                remediation: 'Enable automatic PII redaction for all logs',
                status: 'open'
            });
        }

        return violations;
    }

    private generateRecommendations(
        framework: ComplianceFramework,
        events: AuditEvent[],
        violations: ComplianceViolation[]
    ): string[] {
        const recommendations: string[] = [];

        if (violations.length > 0) {
            recommendations.push(`Address ${violations.length} compliance violations immediately`);
        }

        const criticalEvents = events.filter(e => e.severity === 'critical');
        if (criticalEvents.length > events.length * 0.1) {
            recommendations.push('High rate of critical events - review system stability');
        }

        if (events.some(e => !e.piiRedacted)) {
            recommendations.push('Enable automated PII detection and redaction');
        }

        recommendations.push(`Maintain ${COMPLIANCE_FRAMEWORKS[framework].requiredRetentionDays}-day retention per ${framework.toUpperCase()}`);
        recommendations.push('Regular audit reviews recommended quarterly');

        return recommendations;
    }

    // ============================================
    // Data Export
    // ============================================

    /**
     * Export audit events to JSON
     */
    exportToJSON(events: AuditEvent[]): string {
        return JSON.stringify(events, null, 2);
    }

    /**
     * Export audit events to CSV
     */
    exportToCSV(events: AuditEvent[]): string {
        const headers = [
            'ID', 'Timestamp', 'Type', 'Severity', 'User', 'Action', 'Resource', 'Status'
        ];

        const rows = events.map(e => [
            e.id,
            e.timestamp.toISOString(),
            e.type,
            e.severity,
            e.userName,
            e.action,
            `${e.resourceType}:${e.resourceId}`,
            e.status
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Redact PII from text
     */
    redactPII(text: string): PIIDetectionResult {
        const patterns: PIIPattern[] = [];
        let redactedText = text;

        // Email pattern
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex) || [];
        emails.forEach(email => {
            const [user, domain] = email.split('@');
            const redacted = `${user.slice(0, 2)}***@***${domain.slice(-4)}`;
            redactedText = redactedText.replace(email, redacted);
            patterns.push({ type: 'email', value: email, redacted, confidence: 1.0 });
        });

        // Phone pattern (simple US)
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const phones = text.match(phoneRegex) || [];
        phones.forEach(phone => {
            const redacted = '***-***-' + phone.slice(-4);
            redactedText = redactedText.replace(phone, redacted);
            patterns.push({ type: 'phone', value: phone, redacted, confidence: 0.9 });
        });

        return {
            detected: patterns.length > 0,
            patterns,
            redactedText: patterns.length > 0 ? redactedText : undefined
        };
    }

    // ============================================
    // Public Methods
    // ============================================

    setSelectedFramework(framework: ComplianceFramework): void {
        this._selectedFramework.set(framework);
    }

    setRetentionPolicy(policy: RetentionPolicy): void {
        this._retentionPolicy.set(policy);
    }
}
