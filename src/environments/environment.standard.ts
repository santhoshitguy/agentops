// ============================================
// Standard Tier — $149 Own-Site Deploy
//
// Full UI + REST & WebSocket backend integration.
// Buyers connect their own OpenAI / Anthropic / Google API keys through Settings.
// Real-time dashboards, orchestration, compliance audit, prompt versioning all live.
// Streaming and tool-calling require the Commercial tier.
//
// Build: ng build --configuration standard
// ============================================

import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  tier: 'standard',
  apiUrl: 'https://your-backend.example.com',   // Replace with buyer's backend URL
  wsUrl: 'wss://your-backend.example.com/ws',
  mockMode: false,

  features: {
    // Data & connectivity — fully enabled
    backendIntegration:   true,
    realTimeWebSocket:    true,

    // AI capabilities — bring-your-own-key, but no streaming
    realAiAgents:         false,  // Upgrade to Commercial for live agent execution
    streamingResponses:   false,
    toolCalling:          false,
    multiModelSupport:    true,

    // Feature pages — all enabled
    orchestrationPlanner: true,
    workflowBuilder:      true,
    complianceAudit:      true,
    openTelemetry:        true,
    costForecasting:      true,
    promptVersioning:     true,
    alertRuleBuilder:     true,

    // Advanced — most enabled, team & webhooks need Commercial
    reportExport:         true,
    apiKeyManagement:     true,
    teamFeatures:         false,
    webhookIntegration:   false,

    // Always included
    errorDebugger:        true,
    agentBenchmarks:      true,
  },

  integrations: {
    orchestrationToStore:  true,
    otelAutoSync:          true,
    complianceAutoSync:    true,
    outcomeMetricsSync:    true,
    costForecastRealTime:  true,
    realAiAgents:          false,
    streamingResponses:    false,
    toolCalling:           false,
  },
};
