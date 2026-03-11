import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-banner',
  imports: [CommonModule],
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertBanner {
  private alertService = inject(AlertService);
  criticalAlert = this.alertService.criticalAlert;
  dismissed = signal(false);

  getSeverityColor(severity: string): string {
    return severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#00d4ff';
  }

  dismiss(): void { this.dismissed.set(true); }

  acknowledge(): void {
    const alert = this.criticalAlert();
    if (alert) {
      this.alertService.acknowledgeAlert(alert.id);
      this.dismissed.set(false);
    }
  }
}
