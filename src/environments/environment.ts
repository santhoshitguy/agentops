// ============================================
// Development Environment Configuration
// Loaded by default during `ng serve` and `ng build --configuration=development`
// All features enabled so developers can exercise every screen locally.
// ============================================

export type { Environment, EnvironmentFeatures, EnvironmentIntegrations, EnvironmentTier } from './environment.model';
import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  tier: 'development',
  apiUrl: 'http://localhost:8081',
  wsUrl: 'ws://localhost:8081/ws',
  mockMode: true,
  mockServerUrl: 'http://localhost:8081',

  features: {
    // Data & connectivity
    backendIntegration: true,
    realTimeWebSocket: true,

    // AI capabilities — streaming + real agent executor enabled (Step 6-7)
    realAiAgents: true,
    streamingResponses: true,
    toolCalling: false,   // Phase 2
    multiModelSupport: true,

    // Feature pages — all on for dev
    orchestrationPlanner: true,
    workflowBuilder: true,
    complianceAudit: true,
    openTelemetry: true,
    costForecasting: true,
    promptVersioning: true,
    alertRuleBuilder: true,

    // Advanced
    reportExport: true,
    apiKeyManagement: true,
    teamFeatures: true,
    webhookIntegration: true,

    // Always included
    errorDebugger: true,
    agentBenchmarks: true,
  },

  integrations: {
    orchestrationToStore: true,
    otelAutoSync: true,
    complianceAutoSync: true,
    outcomeMetricsSync: true,
    costForecastRealTime: true,
    realAiAgents: true,
    streamingResponses: true,
    toolCalling: false,
  },
};
