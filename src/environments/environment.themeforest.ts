// ============================================
// ThemeForest Tier — $59 UI Template
//
// All 20 screens are fully visible and interactive with rich mock data.
// No backend calls are made. Buyers get the complete Angular source to
// customise for their own projects.
//
// Build: ng build --configuration themeforest
// ============================================

import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  tier: 'themeforest',
  apiUrl: '',   // No backend — all data is mock
  wsUrl: '',
  mockMode: true,

  features: {
    // Data & connectivity — mock only (no backend calls)
    backendIntegration:   false,
    realTimeWebSocket:    true,   // Mock WebSocket ticker enabled for live UI demo

    // AI capabilities — simulated with mock data (no API keys needed)
    realAiAgents:         false,
    streamingResponses:   true,   // Simulated streaming in playground
    toolCalling:          false,
    multiModelSupport:    true,   // Model comparison UI enabled with mock data

    // All 10 showcase feature pages fully enabled with rich mock data
    orchestrationPlanner: true,
    workflowBuilder:      true,
    complianceAudit:      true,
    openTelemetry:        true,
    costForecasting:      true,
    promptVersioning:     true,
    alertRuleBuilder:     true,

    // Advanced UI features — enabled for full demo experience
    reportExport:         true,
    apiKeyManagement:     true,
    teamFeatures:         false,  // Multi-tenant — not included in ThemeForest tier
    webhookIntegration:   false,  // Backend-dependent — not included in ThemeForest tier

    // Always included
    errorDebugger:        true,
    agentBenchmarks:      true,
  },

  integrations: {
    orchestrationToStore:  true,   // Mock orchestration → store sync
    otelAutoSync:          false,
    complianceAutoSync:    true,   // Mock compliance data sync
    outcomeMetricsSync:    true,   // Mock outcome metrics sync
    costForecastRealTime:  true,   // Mock cost forecast real-time updates
    realAiAgents:          false,
    streamingResponses:    false,
    toolCalling:           false,
  },
};
