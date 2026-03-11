import { Component, ChangeDetectionStrategy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Bell } from 'lucide-angular';
import { AlertService } from '../../../core/services/alert.service';
import { Alert } from '../../../core/models/alert.model';
import { RelativeTimePipe } from '../../pipes/relative-time-pipe';

@Component({
  selector: 'app-notification-dropdown',
  imports: [CommonModule, RouterModule, LucideAngularModule, RelativeTimePipe],
  templateUrl: './notification-dropdown.html',
  styleUrl: './notification-dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDropdown {
  private alertService = inject(AlertService);
  private router = inject(Router);

  isOpen = signal(false);
  bellIcon = Bell;
  unreadCount = this.alertService.unreadCount;
  recentAlerts = computed(() => this.alertService.alerts().slice(0, 15));

  toggle(): void { this.isOpen.update(v => !v); }
  close(): void { this.isOpen.set(false); }

  acknowledge(id: string, event: Event): void {
    event.stopPropagation();
    this.alertService.acknowledgeAlert(id);
  }

  acknowledgeAll(): void {
    this.alertService.acknowledgeAll();
    this.close();
  }

  /**
   * Handles a click on an alert item:
   * 1. Marks the alert as acknowledged
   * 2. Closes the dropdown
   * 3. Navigates to the most relevant feature page based on alert type + relatedEntityType
   *
   * Routing table:
   *   budget_exceeded | cost_spike         → /cost-forecast
   *   rate_limit                           → /cost-forecast
   *   failure_spike   (audit entity)       → /compliance-audit?auditId=&tab=timeline
   *   failure_spike   (agent/tool/exec)    → /error-analytics
   *   latency_degradation                  → /error-analytics
   *   agent_down                           → /dashboard
   *   custom          (audit entity)       → /compliance-audit?auditId=&tab=timeline
   *   custom          (other)              → no navigation (stay on current page)
   */
  handleAlertClick(alert: Alert): void {
    // Always acknowledge and close first
    this.alertService.acknowledgeAlert(alert.id);
    this.close();

    const { type, relatedEntityType, relatedEntityId } = alert;


    // ── Budget / cost alerts ─────────────────────────────────────────
    if (type === 'budget_exceeded' || type === 'cost_spike' || type === 'rate_limit') {
      this.router.navigate(['/cost-forecast']);
      return;
    }

    // ── Compliance / audit-linked alerts ────────────────────────────
    if (relatedEntityType === 'audit') {
      const queryParams: Record<string, string> = { tab: 'timeline' };
      if (relatedEntityId) queryParams['auditId'] = relatedEntityId;
      this.router.navigate(['/compliance-audit'], { queryParams });
      return;
    }

    // ── Failure spikes → error analytics (unless audit-linked above) ─
    if (type === 'failure_spike') {
      this.router.navigate(['/error-analytics']);
      return;
    }

    // ── Latency / performance alerts ────────────────────────────────
    if (type === 'latency_degradation') {
      this.router.navigate(['/error-analytics']);
      return;
    }

    // ── Agent down alerts ───────────────────────────────────────────
    if (type === 'agent_down') {
      this.router.navigate(['/dashboard-v1']);
      return;
    }

    // ── Custom alerts: no guaranteed destination — stay on page ─────
  }

  /** Returns a CSS cursor hint so the template can show 'pointer' for navigable alerts */
  isNavigable(alert: Alert): boolean {
    return alert.type !== 'custom' || alert.relatedEntityType === 'audit';
  }

  getSeverityColor(severity: string): string {
    return severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#00d4ff';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('app-notification-dropdown')) {
      this.close();
    }
  }
}
