// ============================================
// Environment type definitions
// Shared by all environment files — never replaced by fileReplacements
// ============================================

export type EnvironmentTier = 'development' | 'themeforest' | 'standard' | 'commercial';

/**
 * Feature flags — control what each distribution tier can do.
 *
 * Tier summary:
 *   development  — all backend flags on (dev mode, no AI by default)
 *   themeforest  — UI-only template ($59). All 20 screens visible with mock data.
 *                  No backend calls. Perfect for buyers who want the UI to customise.
 *   standard     — Own-site deploy ($149). REST + WebSocket backend wired up.
 *                  Buyer brings their own API keys. No streaming / tool-calling.
 *   commercial   — Full stack ($299+ / SaaS). Real AI agents, streaming, tool-calling,
 *                  team features, webhooks.
 */
export interface EnvironmentFeatures {
  // ── Data & connectivity ────────────────────────────────────────────────────
  /** Connect to REST API backend for live data */
  backendIntegration: boolean;
  /** Live WebSocket data feeds for real-time dashboards */
  realTimeWebSocket: boolean;

  // ── AI capabilities ────────────────────────────────────────────────────────
  /** Execute real LLM API calls (OpenAI / Anthropic / Google) */
  realAiAgents: boolean;
  /** Token streaming via Server-Sent Events */
  streamingResponses: boolean;
  /** Function / tool-calling pipeline */
  toolCalling: boolean;
  /** Configure and compare multiple AI providers simultaneously */
  multiModelSupport: boolean;

  // ── Feature pages ─────────────────────────────────────────────────────────
  /** Multi-agent orchestration planner */
  orchestrationPlanner: boolean;
  /** Visual drag-drop workflow canvas builder */
  workflowBuilder: boolean;
  /** Compliance dashboard + full audit trail */
  complianceAudit: boolean;
  /** OpenTelemetry trace viewer */
  openTelemetry: boolean;
  /** Real-time cost tracking + 30-day forecast */
  costForecasting: boolean;
  /** Prompt version control + A/B experiment runner */
  promptVersioning: boolean;
  /** Custom alert rule builder */
  alertRuleBuilder: boolean;

  // ── Advanced / enterprise ──────────────────────────────────────────────────
  /** PDF / CSV export for all reports */
  reportExport: boolean;
  /** Per-agent API key configuration in Settings */
  apiKeyManagement: boolean;
  /** Multi-user / team collaboration features */
  teamFeatures: boolean;
  /** Outbound webhook notifications */
  webhookIntegration: boolean;

  // ── Always included in all tiers ──────────────────────────────────────────
  /** Hallucination detection + error debugger */
  errorDebugger: boolean;
  /** Agent performance benchmarks + live testing */
  agentBenchmarks: boolean;
}

export interface EnvironmentIntegrations {
  /** Link Orchestration plans to AgentStore on load */
  orchestrationToStore: boolean;
  /** Auto-sync OpenTelemetry spans on agent execution */
  otelAutoSync: boolean;
  /** Auto-generate compliance events from agent actions */
  complianceAutoSync: boolean;
  /** Push execution results into Outcome Metrics */
  outcomeMetricsSync: boolean;
  /** Pull real-time cost data from backend pricing API */
  costForecastRealTime: boolean;
  /** Enable real AI agent execution (off until backend is wired) */
  realAiAgents: boolean;
  /** Enable token streaming responses from LLM APIs */
  streamingResponses: boolean;
  /** Enable tool-calling / function-calling pipeline */
  toolCalling: boolean;
}

export interface Environment {
  production: boolean;
  /** Distribution tier — used by FeatureFlagService */
  tier: EnvironmentTier;
  /** Base URL for REST API (no trailing slash) */
  apiUrl: string;
  /** WebSocket server URL */
  wsUrl: string;
  /** When true, all services use mock data generators instead of HTTP calls */
  mockMode: boolean;
  /** URL of the local mock REST + WS server. When DataModeService = 'mock',
   *  ApiService and AuthService route all HTTP calls here instead of apiUrl.
   *  Default: http://localhost:3001 (run with `npm run mock-server`) */
  mockServerUrl?: string;
  /** Fine-grained feature flags per tier */
  features: EnvironmentFeatures;
  /** Integration flags for gradual backend rollout (kept for compatibility) */
  integrations: EnvironmentIntegrations;
}
