/**
 * Compliance & Audit Trail Models
 * Enterprise-grade audit logging for regulatory compliance
 */

// ============================================
// Core Types
// ============================================

export type AuditEventType =
    | 'agent_created' | 'agent_updated' | 'agent_deleted'
    | 'task_started' | 'task_completed' | 'task_failed'
    | 'data_accessed' | 'data_modified' | 'data_deleted'
    | 'user_login' | 'user_logout' | 'permission_changed'
    | 'config_updated' | 'api_call' | 'error_occurred';

export type ComplianceFramework = 'gdpr' | 'hipaa' | 'sox' | 'iso27001' | 'soc2' | 'pci_dss';
export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type AuditSeverity = 'info' | 'warning' | 'critical';

// ============================================
// Audit Event
// ============================================

/**
 * Individual audit log entry
 */
export interface AuditEvent {
    id: string;
    timestamp: Date;

    // Event classification
    type: AuditEventType;
    severity: AuditSeverity;
    category: string;                    // e.g., "data_access", "system_config"

    // Actor information
    userId: string;
    userName: string;
    userRole: string;
    ipAddress: string;
    userAgent: string;

    // Target resource
    resourceType: string;                // e.g., "agent", "task", "user"
    resourceId: string;
    resourceName?: string;

    // Action details
    action: string;                      // Human-readable description
    status: 'success' | 'failure' | 'partial';

    // Data context
    beforeState?: Record<string, any>;   // State before change
    afterState?: Record<string, any>;    // State after change
    metadata?: Record<string, any>;      // Additional context

    // Compliance
    sensitivityLevel: SensitivityLevel;
    complianceFlags: ComplianceFramework[];
    piiRedacted: boolean;

    // Correlation
    sessionId?: string;
    traceId?: string;                    // Distributed tracing
    parentEventId?: string;              // Linked events
}

// ============================================
// Compliance Report
// ============================================

/**
 * Compliance audit report
 */
export interface ComplianceReport {
    id: string;
    generatedAt: Date;
    generatedBy: string;

    // Report scope
    framework: ComplianceFramework;
    startDate: Date;
    endDate: Date;

    // Statistics
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    uniqueUsers: number;

    // Compliance metrics
    complianceScore: number;             // 0-100
    violations: ComplianceViolation[];
    recommendations: string[];

    // Data retention
    eventsRetained: number;
    eventsPurged: number;
    oldestEvent?: Date;

    // Export
    exportFormat?: 'pdf' | 'csv' | 'json';
    exportPath?: string;
}

/**
 * Compliance violation
 */
export interface ComplianceViolation {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';

    rule: string;                        // e.g., "GDPR Article 32"
    description: string;
    affectedEvents: string[];            // Audit event IDs

    remediation: string;
    status: 'open' | 'acknowledged' | 'resolved';
    resolvedAt?: Date;
    resolvedBy?: string;
}

// ============================================
// Data Retention Policy
// ============================================

/**
 * Audit log retention configuration
 */
export interface RetentionPolicy {
    id: string;
    name: string;
    enabled: boolean;

    // Retention rules
    retentionDays: number;               // How long to keep logs
    archiveBeforePurge: boolean;         // Archive before deletion
    archivePath?: string;

    // Selective retention
    retainByType?: Record<AuditEventType, number>;  // Override per event type
    retainBySeverity?: Record<AuditSeverity, number>;

    // Execution
    lastExecuted?: Date;
    nextExecution?: Date;
    executionSchedule: string;           // Cron expression
}

// ============================================
// Audit Search/Filter
// ============================================

/**
 * Search criteria for audit logs
 */
export interface AuditSearchCriteria {
    // Time range
    startDate?: Date;
    endDate?: Date;

    // Filters
    eventTypes?: AuditEventType[];
    severities?: AuditSeverity[];
    userIds?: string[];
    resourceTypes?: string[];
    resourceIds?: string[];

    // Text search
    searchQuery?: string;                // Full-text search

    // Compliance
    frameworks?: ComplianceFramework[];
    sensitivityLevels?: SensitivityLevel[];

    // Pagination
    page: number;
    pageSize: number;
    sortBy: 'timestamp' | 'severity' | 'type';
    sortOrder: 'asc' | 'desc';
}

/**
 * Audit search results
 */
export interface AuditSearchResult {
    events: AuditEvent[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;

    // Aggregations
    aggregations: {
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        byUser: Record<string, number>;
        byResource: Record<string, number>;
    };
}

// ============================================
// Privacy & Compliance  
// ============================================

/**
 * PII (Personally Identifiable Information) detection
 */
export interface PIIDetectionResult {
    detected: boolean;
    patterns: PIIPattern[];
    redactedText?: string;
}

/**
 * PII pattern types
 */
export interface PIIPattern {
    type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address' | 'name' | 'address';
    value: string;
    redacted: string;                    // e.g., "***@****.com"
    confidence: number;                  // 0-1
}

/**
 * Data export request (GDPR right to data portability)
 */
export interface DataExportRequest {
    id: string;
    requestedAt: Date;
    requestedBy: string;

    // Scope
    userId: string;
    startDate: Date;
    endDate: Date;
    includeRelatedEvents: boolean;

    // Status
    status: 'pending' | 'processing' | 'completed' | 'failed';
    completedAt?: Date;

    // Export
    format: 'json' | 'csv' | 'xml';
    filePath?: string;
    fileSize?: number;
    expiresAt?: Date;                    // Download link expiration
}

// ============================================
// Constants & Templates
// ============================================

/**
 * Compliance framework requirements
 */
export const COMPLIANCE_FRAMEWORKS: Record<ComplianceFramework, {
    name: string;
    description: string;
    requiredRetentionDays: number;
    requiredEventTypes: AuditEventType[];
}> = {
    gdpr: {
        name: 'GDPR (EU)',
        description: 'General Data Protection Regulation',
        requiredRetentionDays: 365,
        requiredEventTypes: ['data_accessed', 'data_modified', 'data_deleted', 'user_login']
    },
    hipaa: {
        name: 'HIPAA (US Healthcare)',
        description: 'Health Insurance Portability and Accountability Act',
        requiredRetentionDays: 2190,       // 6 years
        requiredEventTypes: ['data_accessed', 'data_modified', 'data_deleted', 'permission_changed']
    },
    sox: {
        name: 'SOX (US Financial)',
        description: 'Sarbanes-Oxley Act',
        requiredRetentionDays: 2555,       // 7 years
        requiredEventTypes: ['data_modified', 'data_deleted', 'config_updated']
    },
    iso27001: {
        name: 'ISO 27001',
        description: 'Information Security Management',
        requiredRetentionDays: 365,
        requiredEventTypes: ['permission_changed', 'config_updated', 'error_occurred']
    },
    soc2: {
        name: 'SOC 2',
        description: 'Service Organization Control',
        requiredRetentionDays: 365,
        requiredEventTypes: ['user_login', 'user_logout', 'permission_changed', 'config_updated']
    },
    pci_dss: {
        name: 'PCI DSS',
        description: 'Payment Card Industry Data Security Standard',
        requiredRetentionDays: 365,
        requiredEventTypes: ['data_accessed', 'data_modified', 'permission_changed']
    }
};

/**
 * Event type metadata
 */
export const EVENT_TYPE_METADATA: Record<AuditEventType, {
    label: string;
    icon: string;
    defaultSeverity: AuditSeverity;
    category: string;
}> = {
    agent_created: { label: 'Agent Created', icon: '🤖', defaultSeverity: 'info', category: 'agent_lifecycle' },
    agent_updated: { label: 'Agent Updated', icon: '✏️', defaultSeverity: 'info', category: 'agent_lifecycle' },
    agent_deleted: { label: 'Agent Deleted', icon: '🗑️', defaultSeverity: 'warning', category: 'agent_lifecycle' },
    task_started: { label: 'Task Started', icon: '▶️', defaultSeverity: 'info', category: 'task_execution' },
    task_completed: { label: 'Task Completed', icon: '✅', defaultSeverity: 'info', category: 'task_execution' },
    task_failed: { label: 'Task Failed', icon: '❌', defaultSeverity: 'critical', category: 'task_execution' },
    data_accessed: { label: 'Data Accessed', icon: '👁️', defaultSeverity: 'info', category: 'data_operations' },
    data_modified: { label: 'Data Modified', icon: '📝', defaultSeverity: 'warning', category: 'data_operations' },
    data_deleted: { label: 'Data Deleted', icon: '🗑️', defaultSeverity: 'critical', category: 'data_operations' },
    user_login: { label: 'User Login', icon: '🔓', defaultSeverity: 'info', category: 'authentication' },
    user_logout: { label: 'User Logout', icon: '🔒', defaultSeverity: 'info', category: 'authentication' },
    permission_changed: { label: 'Permission Changed', icon: '🔐', defaultSeverity: 'warning', category: 'security' },
    config_updated: { label: 'Configuration Updated', icon: '⚙️', defaultSeverity: 'warning', category: 'system' },
    api_call: { label: 'API Call', icon: '🔌', defaultSeverity: 'info', category: 'integration' },
    error_occurred: { label: 'Error Occurred', icon: '⚠️', defaultSeverity: 'critical', category: 'system' }
};

/**
 * Severity colors
 */
export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
    info: 'var(--color-cyan)',
    warning: 'var(--color-neon-yellow)',
    critical: 'var(--color-neon-red)'
};

/**
 * Sample retention policies
 */
export const DEFAULT_RETENTION_POLICIES: Partial<RetentionPolicy>[] = [
    {
        name: 'Standard (90 days)',
        retentionDays: 90,
        archiveBeforePurge: true,
        executionSchedule: '0 0 * * 0'     // Weekly on Sunday
    },
    {
        name: 'GDPR Compliant (1 year)',
        retentionDays: 365,
        archiveBeforePurge: true,
        executionSchedule: '0 0 1 * *'     // Monthly
    },
    {
        name: 'HIPAA Compliant (6 years)',
        retentionDays: 2190,
        archiveBeforePurge: true,
        executionSchedule: '0 0 1 * *'
    },
    {
        name: 'Critical Only (Indefinite)',
        retentionDays: -1,                 // Never purge
        retainBySeverity: {
            info: 90,
            warning: 365,
            critical: -1
        },
        executionSchedule: '0 0 * * 0'
    }
];
