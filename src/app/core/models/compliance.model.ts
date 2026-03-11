import { AuditEvent, ComplianceFramework } from './audit.model';

/**
 * Immutable Audit Log Entry
 * Extends the base AuditEvent with additional compliance metadata
 */
export interface AuditLogEntry extends Readonly<AuditEvent> {
    readonly traceId?: string; // Link to OTel
    readonly riskScore?: number; // Calculated risk for this specific event
    readonly policyViolations?: string[]; // IDs of violated policies
}

/**
 * Data Access Record
 * Used for Heatmap visualization (Agent vs Data Source)
 */
export interface DataAccessRecord {
    agentId: string;
    agentName: string;
    dataSourceId: string; // e.g., "database:users", "s3:logs"
    dataSourceType: string;
    accessType: 'read' | 'write' | 'delete';
    timestamp: Date;
    status: 'success' | 'failure';
}

/**
 * Compliance Policy Rule
 */
export interface CompliancePolicy {
    id: string;
    name: string;
    description: string;
    framework: ComplianceFramework;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;

    // Evaluation Logic
    condition: (entry: AuditLogEntry) => boolean;

    // Metadata
    created: Date;
    lastUpdated: Date;
}

/**
 * Risk Factor Signal
 * Used to calculate the aggregate Risk Score
 */
export interface RiskFactor {
    id: string;
    name: string;
    description: string;
    weight: number; // 0.0 to 1.0
    value: number; // 0 to 100 (Current level)
    source: 'policy' | 'anomaly' | 'configuration' | 'manual';
    lastUpdated: Date;
}

/**
 * Aggregate Risk Score
 */
export interface RiskScore {
    overallScore: number; // 0-100 (0=Safe, 100=Critical)
    level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    factors: RiskFactor[];
    trend: 'up' | 'down' | 'stable';
    timestamp: Date;
}

/**
 * Heatmap Data Point
 */
export interface HeatmapCell {
    agentId: string;
    dataSourceId: string;
    accessCount: number;
    errorCount: number;
    riskLevel: number; // Normalized 0-1
}
