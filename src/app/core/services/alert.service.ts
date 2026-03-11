import { Injectable, signal, computed, OnDestroy, effect, inject } from '@angular/core';
import { Alert, AlertRule, AlertSeverity, AlertType } from '../models/alert.model';
import { SeedDataService } from './seed-data.service';
import { DataModeService } from './data-mode.service';

@Injectable({ providedIn: 'root' })
export class AlertService implements OnDestroy {
  private readonly seedData  = inject(SeedDataService);
  private readonly dataMode  = inject(DataModeService);
  private readonly _alerts = signal<Alert[]>([]);
  private readonly _rules  = signal<AlertRule[]>([]);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly alerts = this._alerts.asReadonly();
  readonly rules = this._rules.asReadonly();

  readonly activeAlerts = computed(() =>
    this._alerts().filter(a => !a.acknowledged && !a.resolvedAt)
  );

  readonly unreadCount = computed(() => this.activeAlerts().length);

  readonly criticalAlert = computed(() => {
    const active = this.activeAlerts();
    const critical = active.filter(a => a.severity === 'critical');
    if (critical.length > 0) return critical[0];
    const warning = active.filter(a => a.severity === 'warning');
    if (warning.length > 0) return warning[0];
    return active.length > 0 ? active[0] : null;
  });

  constructor() {
    this._alerts.set(this.seedData.getAlerts());
    this._rules.set(this.seedData.getAlertRules());
    effect(() => {
      if (this.dataMode.isMock()) {
        this._alerts.set(this.seedData.getAlerts());
        this._rules.set(this.seedData.getAlertRules());
      }
    });
    this.startMockGeneration();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  acknowledgeAlert(id: string): void {
    this._alerts.update(alerts =>
      alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a)
    );
  }

  resolveAlert(id: string): void {
    this._alerts.update(alerts =>
      alerts.map(a => a.id === id ? { ...a, resolvedAt: new Date(), acknowledged: true } : a)
    );
  }

  addAlert(alert: Alert): void {
    this._alerts.update(alerts => [alert, ...alerts]);
  }

  addRule(rule: AlertRule): void {
    this._rules.update(rules => [...rules, rule]);
  }

  removeRule(id: string): void {
    this._rules.update(rules => rules.filter(r => r.id !== id));
  }

  toggleRule(id: string): void {
    this._rules.update(rules =>
      rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
  }

  acknowledgeAll(): void {
    this._alerts.update(alerts =>
      alerts.map(a => ({ ...a, acknowledged: true }))
    );
  }

  private startMockGeneration(): void {
    this.intervalId = setInterval(() => {
      const types: AlertType[] = ['cost_spike', 'failure_spike', 'latency_degradation', 'budget_exceeded', 'agent_down', 'rate_limit', 'custom'];
      const severities: AlertSeverity[] = ['info', 'warning', 'critical'];
      const titles: Record<AlertType, string> = {
        cost_spike: 'Cost spike detected',
        failure_spike: 'Failure rate increase',
        latency_degradation: 'Latency degradation',
        budget_exceeded: 'Budget threshold exceeded',
        agent_down: 'Agent unresponsive',
        rate_limit: 'Rate limit approaching',
        custom: 'Custom alert triggered',
      };
      const messages: Record<AlertType, string> = {
        cost_spike: 'Token spend increased 45% in the last 15 minutes across GPT-4 agents.',
        failure_spike: 'Error rate jumped to 12% for CodeReview agent in the past 5 minutes.',
        latency_degradation: 'P95 latency for DataPipeline agent exceeded 8s threshold.',
        budget_exceeded: 'Daily budget utilization has crossed 85% with 6 hours remaining.',
        agent_down: 'ResearchBot agent has not responded to health checks for 3 minutes.',
        rate_limit: 'API rate limit usage at 92% for OpenAI endpoint.',
        custom: 'Scheduled maintenance window approaching in 30 minutes.',
      };

      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];

      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        severity,
        title: titles[type],
        message: messages[type],
        timestamp: new Date(),
        acknowledged: false,
      };

      this.addAlert(alert);
    }, 12000);
  }

  private generateMockAlerts(): Alert[] {
    const now = Date.now();
    const alerts: Alert[] = [
      { id: 'a1', type: 'cost_spike', severity: 'critical', title: 'Cost spike detected', message: 'Token spend increased 45% in the last 15 minutes across GPT-4 agents.', timestamp: new Date(now - 120000), acknowledged: false, relatedEntityId: 'agent-gpt4', relatedEntityType: 'agent' },
      { id: 'a2', type: 'failure_spike', severity: 'critical', title: 'Failure rate surge', message: 'Error rate jumped to 18% for CodeReview agent cluster.', timestamp: new Date(now - 300000), acknowledged: false, relatedEntityId: 'agent-codereview', relatedEntityType: 'agent' },
      { id: 'a3', type: 'agent_down', severity: 'critical', title: 'Agent unresponsive', message: 'ResearchBot agent has not responded to health checks for 5 minutes.', timestamp: new Date(now - 600000), acknowledged: false, relatedEntityId: 'agent-research', relatedEntityType: 'agent' },
      { id: 'a4', type: 'latency_degradation', severity: 'warning', title: 'Latency degradation', message: 'P95 latency for DataPipeline agent exceeded 8s threshold.', timestamp: new Date(now - 900000), acknowledged: false, relatedEntityId: 'agent-pipeline', relatedEntityType: 'agent' },
      { id: 'a5', type: 'budget_exceeded', severity: 'warning', title: 'Budget threshold exceeded', message: 'Daily budget utilization has crossed 85% with 6 hours remaining.', timestamp: new Date(now - 1200000), acknowledged: false },
      { id: 'a6', type: 'rate_limit', severity: 'warning', title: 'Rate limit approaching', message: 'API rate limit usage at 92% for OpenAI endpoint.', timestamp: new Date(now - 1800000), acknowledged: false, relatedEntityId: 'tool-openai', relatedEntityType: 'tool' },
      { id: 'a7', type: 'cost_spike', severity: 'info', title: 'Cost trend advisory', message: 'Projected daily cost is 15% above average. Consider reviewing active agents.', timestamp: new Date(now - 2400000), acknowledged: false },
      { id: 'a8', type: 'failure_spike', severity: 'warning', title: 'Intermittent failures', message: 'Sporadic 503 errors detected from Anthropic API endpoint.', timestamp: new Date(now - 3600000), acknowledged: true, relatedEntityId: 'tool-anthropic', relatedEntityType: 'tool' },
      { id: 'a9', type: 'latency_degradation', severity: 'info', title: 'Latency improvement', message: 'Average latency decreased 20% after scaling adjustment.', timestamp: new Date(now - 5400000), acknowledged: true, resolvedAt: new Date(now - 4800000) },
      { id: 'a10', type: 'agent_down', severity: 'critical', title: 'Agent crash recovered', message: 'SummaryBot agent crashed and was auto-restarted successfully.', timestamp: new Date(now - 7200000), acknowledged: true, resolvedAt: new Date(now - 6600000), relatedEntityId: 'agent-summary', relatedEntityType: 'agent' },
      { id: 'a11', type: 'custom', severity: 'info', title: 'Scheduled maintenance', message: 'System maintenance window scheduled for 02:00-04:00 UTC.', timestamp: new Date(now - 10800000), acknowledged: true },
      { id: 'a12', type: 'budget_exceeded', severity: 'critical', title: 'Budget overrun', message: 'Monthly budget exceeded by 12%. Auto-scaling has been paused.', timestamp: new Date(now - 14400000), acknowledged: true, resolvedAt: new Date(now - 12000000) },
      { id: 'a13', type: 'rate_limit', severity: 'info', title: 'Rate limit reset', message: 'Rate limit counters have been reset for the new billing period.', timestamp: new Date(now - 18000000), acknowledged: true, resolvedAt: new Date(now - 17400000) },
      { id: 'a14', type: 'failure_spike', severity: 'warning', title: 'Timeout cluster', message: 'Multiple timeout errors detected in QA-Testing agent group.', timestamp: new Date(now - 21600000), acknowledged: true, relatedEntityId: 'agent-qa', relatedEntityType: 'agent' },
      { id: 'a15', type: 'latency_degradation', severity: 'info', title: 'Network latency spike', message: 'Transient network latency increase detected and resolved.', timestamp: new Date(now - 25200000), acknowledged: true, resolvedAt: new Date(now - 24000000) },
    ];
    return alerts;
  }

  private generateDefaultRules(): AlertRule[] {
    return [
      { id: 'rule-1', name: 'High Error Rate', condition: { metric: 'error_rate', operator: '>', threshold: 10, windowMinutes: 5 }, severity: 'critical', enabled: true, cooldownMinutes: 15, channels: ['in-app', 'email'] },
      { id: 'rule-2', name: 'Cost Surge', condition: { metric: 'cost_per_hour', operator: '>', threshold: 50, windowMinutes: 15 }, severity: 'warning', enabled: true, cooldownMinutes: 30, channels: ['in-app'] },
      { id: 'rule-3', name: 'Latency Threshold', condition: { metric: 'latency_p95', operator: '>=', threshold: 5000, windowMinutes: 10 }, severity: 'warning', enabled: true, cooldownMinutes: 20, channels: ['in-app', 'webhook'] },
      { id: 'rule-4', name: 'Queue Backup', condition: { metric: 'queue_depth', operator: '>', threshold: 100, windowMinutes: 5 }, severity: 'critical', enabled: false, cooldownMinutes: 10, channels: ['in-app', 'email', 'webhook'] },
      { id: 'rule-5', name: 'Budget Warning', condition: { metric: 'budget_usage', operator: '>=', threshold: 80, windowMinutes: 60 }, severity: 'warning', enabled: true, cooldownMinutes: 60, channels: ['in-app', 'email'] },
    ];
  }
}
