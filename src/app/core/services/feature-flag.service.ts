import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EnvironmentFeatures, EnvironmentTier } from '../../../environments/environment.model';

// ─── Tier metadata ────────────────────────────────────────────────────────────

export interface TierInfo {
  id: EnvironmentTier;
  label: string;
  price: string;
  badgeColor: string;  // CSS color for header badge
  description: string;
}

const TIER_META: Record<EnvironmentTier, TierInfo> = {
  development: {
    id: 'development',
    label: 'Dev',
    price: 'local',
    badgeColor: '#b388ff',   // purple
    description: 'Development build — all flags enabled',
  },
  themeforest: {
    id: 'themeforest',
    label: 'ThemeForest',
    price: '$59',
    badgeColor: '#ff9100',   // orange
    description: 'UI-only template — full mock data, no backend',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    price: '$149',
    badgeColor: '#00e5ff',   // cyan
    description: 'Own-site deploy — REST + WebSocket backend',
  },
  commercial: {
    id: 'commercial',
    label: 'Commercial',
    price: '$299',
    badgeColor: '#00e676',   // green
    description: 'Full stack — real AI agents, streaming, team features',
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * FeatureFlagService
 *
 * Reads the current environment's `tier` and `features` object and exposes
 * typed computed signals for every flag. Use this anywhere in the app to
 * gate functionality per distribution tier:
 *
 *   @if (flags.realAiAgents()) { ... } @else { <app-upgrade-notice /> }
 *
 * Flags are statically set at build time via fileReplacements in angular.json.
 * Runtime overrides via localStorage are supported for dev/demo purposes.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {

  // ── Tier ──────────────────────────────────────────────────────────────────

  private readonly _tier = signal<EnvironmentTier>(this._resolveTier());

  readonly tier     = this._tier.asReadonly();
  readonly tierInfo = computed(() => TIER_META[this._tier()]);
  readonly tierLabel = computed(() => TIER_META[this._tier()].label);
  readonly tierBadgeColor = computed(() => TIER_META[this._tier()].badgeColor);
  readonly tierPrice = computed(() => TIER_META[this._tier()].price);

  readonly isThemeForest = computed(() => this._tier() === 'themeforest');
  readonly isStandard    = computed(() => this._tier() === 'standard');
  readonly isCommercial  = computed(() => this._tier() === 'commercial');
  readonly isDev         = computed(() => this._tier() === 'development');

  // ── Feature flags (computed from resolved env, never from signal — static) ─

  private readonly _features = this._resolveFeatures();

  // Data & connectivity
  readonly backendIntegration  = computed(() => this._features.backendIntegration);
  readonly realTimeWebSocket   = computed(() => this._features.realTimeWebSocket);

  // AI capabilities
  readonly realAiAgents        = computed(() => this._features.realAiAgents);
  readonly streamingResponses  = computed(() => this._features.streamingResponses);
  readonly toolCalling         = computed(() => this._features.toolCalling);
  readonly multiModelSupport   = computed(() => this._features.multiModelSupport);

  // Feature pages
  readonly orchestrationPlanner = computed(() => this._features.orchestrationPlanner);
  readonly workflowBuilder      = computed(() => this._features.workflowBuilder);
  readonly complianceAudit      = computed(() => this._features.complianceAudit);
  readonly openTelemetry        = computed(() => this._features.openTelemetry);
  readonly costForecasting      = computed(() => this._features.costForecasting);
  readonly promptVersioning     = computed(() => this._features.promptVersioning);
  readonly alertRuleBuilder     = computed(() => this._features.alertRuleBuilder);

  // Advanced
  readonly reportExport         = computed(() => this._features.reportExport);
  readonly apiKeyManagement     = computed(() => this._features.apiKeyManagement);
  readonly teamFeatures         = computed(() => this._features.teamFeatures);
  readonly webhookIntegration   = computed(() => this._features.webhookIntegration);

  // Always included
  readonly errorDebugger        = computed(() => this._features.errorDebugger);
  readonly agentBenchmarks      = computed(() => this._features.agentBenchmarks);

  // ── Generic accessor ──────────────────────────────────────────────────────

  /** Check any feature flag by key */
  is(flag: keyof EnvironmentFeatures): boolean {
    return this._features[flag];
  }

  /** Returns all flags as a plain object (useful for debugging) */
  all(): EnvironmentFeatures {
    return { ...this._features };
  }

  // ── Upgrade helpers ───────────────────────────────────────────────────────

  /** Minimum tier that enables a given flag */
  requiredTierFor(flag: keyof EnvironmentFeatures): TierInfo {
    const tiers: EnvironmentTier[] = ['themeforest', 'standard', 'commercial'];
    for (const t of tiers) {
      const tierEnv = TIER_FEATURE_MAP[t];
      if (tierEnv[flag]) return TIER_META[t];
    }
    return TIER_META['commercial'];
  }

  upgradeMessage(flag: keyof EnvironmentFeatures): string {
    const required = this.requiredTierFor(flag);
    return `This feature requires the ${required.label} tier (${required.price}).`;
  }

  // ── Dev-only tier override (localStorage, ignored in production) ───────────

  /** Override tier at runtime for demo purposes (dev only). Reloads the page. */
  devSetTier(tier: EnvironmentTier): void {
    if (environment.production) return;
    localStorage.setItem('agentops_dev_tier', tier);
    window.location.reload();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _resolveTier(): EnvironmentTier {
    // In dev mode, allow localStorage override
    if (!environment.production) {
      const override = localStorage.getItem('agentops_dev_tier') as EnvironmentTier | null;
      if (override && override in TIER_META) return override;
    }
    return (environment as { tier?: EnvironmentTier }).tier ?? 'development';
  }

  private _resolveFeatures(): EnvironmentFeatures {
    const tier = this._tier();
    // In dev mode with tier override, use the overridden tier's feature map
    if (!environment.production && tier !== 'development') {
      return TIER_FEATURE_MAP[tier];
    }
    return (environment as { features?: EnvironmentFeatures }).features
      ?? TIER_FEATURE_MAP['development'];
  }
}

// ─── Static feature map per tier (mirrors the environment files) ─────────────
// Used by requiredTierFor() and dev tier overrides

const TIER_FEATURE_MAP: Record<EnvironmentTier, EnvironmentFeatures> = {
  development: {
    backendIntegration: true, realTimeWebSocket: true,
    realAiAgents: false, streamingResponses: false, toolCalling: false, multiModelSupport: true,
    orchestrationPlanner: true, workflowBuilder: true, complianceAudit: true,
    openTelemetry: true, costForecasting: true, promptVersioning: true, alertRuleBuilder: true,
    reportExport: true, apiKeyManagement: true, teamFeatures: true, webhookIntegration: true,
    errorDebugger: true, agentBenchmarks: true,
  },
  themeforest: {
    backendIntegration: false, realTimeWebSocket: false,
    realAiAgents: false, streamingResponses: false, toolCalling: false, multiModelSupport: false,
    orchestrationPlanner: false, workflowBuilder: false, complianceAudit: false,
    openTelemetry: false, costForecasting: false, promptVersioning: false, alertRuleBuilder: false,
    reportExport: false, apiKeyManagement: false, teamFeatures: false, webhookIntegration: false,
    errorDebugger: true, agentBenchmarks: true,
  },
  standard: {
    backendIntegration: true, realTimeWebSocket: true,
    realAiAgents: false, streamingResponses: false, toolCalling: false, multiModelSupport: true,
    orchestrationPlanner: true, workflowBuilder: true, complianceAudit: true,
    openTelemetry: true, costForecasting: true, promptVersioning: true, alertRuleBuilder: true,
    reportExport: true, apiKeyManagement: true, teamFeatures: false, webhookIntegration: false,
    errorDebugger: true, agentBenchmarks: true,
  },
  commercial: {
    backendIntegration: true, realTimeWebSocket: true,
    realAiAgents: true, streamingResponses: true, toolCalling: true, multiModelSupport: true,
    orchestrationPlanner: true, workflowBuilder: true, complianceAudit: true,
    openTelemetry: true, costForecasting: true, promptVersioning: true, alertRuleBuilder: true,
    reportExport: true, apiKeyManagement: true, teamFeatures: true, webhookIntegration: true,
    errorDebugger: true, agentBenchmarks: true,
  },
};
