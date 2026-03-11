import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Lock,
  ArrowLeft,
  Star,
  Check,
  Zap,
} from 'lucide-angular';

// ── Update this URL to your actual purchase/product page ─────────────────────
const PURCHASE_URL = 'https://your-purchase-link.com';

@Component({
  selector: 'app-pro-upgrade',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './pro-upgrade.component.html',
  styleUrl: './pro-upgrade.component.scss',
})
export class ProUpgradeComponent {
  private route = inject(ActivatedRoute);

  featureName = signal('');
  featureDescription = signal('');

  readonly purchaseUrl = PURCHASE_URL;

  // Lucide icons
  lockIcon = Lock;
  arrowLeftIcon = ArrowLeft;
  starIcon = Star;
  checkIcon = Check;
  zapIcon = Zap;

  readonly proFeatures = [
    'Full access to all 20+ modules',
    'Multi-agent orchestration & workflow canvas',
    'Session replay & task flow visualization',
    'Cost optimization & forecasting dashboards',
    'Compliance, audit & risk scoring',
    'Agent performance & outcome metrics',
    'Hallucination detection (AI-powered)',
    'OpenTelemetry & observability integration',
    'Prompt manager with A/B testing',
    'Priority support & lifetime updates',
  ];

  constructor() {
    const data = this.route.snapshot.data;
    this.featureName.set(data['featureName'] ?? 'This Feature');
    this.featureDescription.set(
      data['featureDescription'] ??
        'Unlock the full power of AgentOps Pro to access this module.',
    );
  }
}
