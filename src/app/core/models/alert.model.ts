export type AlertType = 'cost_spike' | 'failure_spike' | 'latency_degradation' | 'budget_exceeded' | 'agent_down' | 'rate_limit' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'agent' | 'tool' | 'execution' | 'model' | 'audit';
}

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
  channels: ('in-app' | 'email' | 'webhook')[];
}

export interface AlertCondition {
  metric: 'error_rate' | 'cost_per_hour' | 'latency_p95' | 'queue_depth' | 'budget_usage';
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  windowMinutes: number;
}
