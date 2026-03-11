// ============================================
// Commercial Tier — $299 one-time or $29/mo SaaS
//
// Full stack. Real AI agent execution, streaming token responses,
// function/tool-calling pipeline, team collaboration, outbound webhooks.
// All 20 screens wired to live backend + AI providers.
//
// Build: ng build --configuration commercial
// ============================================

import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  tier: 'commercial',
  apiUrl: 'https://your-backend.example.com',   // Replace with deployment URL
  wsUrl: 'wss://your-backend.example.com/ws',
  mockMode: false,

  features: {
    // Data & connectivity — all on
    backendIntegration:   true,
    realTimeWebSocket:    true,

    // AI capabilities — fully enabled
    realAiAgents:         true,
    streamingResponses:   true,
    toolCalling:          true,
    multiModelSupport:    true,

    // Feature pages — all enabled
    orchestrationPlanner: true,
    workflowBuilder:      true,
    complianceAudit:      true,
    openTelemetry:        true,
    costForecasting:      true,
    promptVersioning:     true,
    alertRuleBuilder:     true,

    // Advanced — everything on
    reportExport:         true,
    apiKeyManagement:     true,
    teamFeatures:         true,
    webhookIntegration:   true,

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
    realAiAgents:          true,
    streamingResponses:    true,
    toolCalling:           true,
  },
};
