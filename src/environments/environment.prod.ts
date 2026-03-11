// ============================================
// Production Environment Configuration
// Swapped in by angular.json fileReplacements during `ng build --configuration=production`
//
// ⚙️  BUYER SETUP — Replace the URLs below with your backend before building:
//
//   apiUrl  → Your REST API base URL  (e.g. https://api.yourdomain.com)
//   wsUrl   → Your WebSocket URL      (e.g. wss://api.yourdomain.com/ws)
//
// Then run:  ng build --configuration production
//
// See docs/setup-guide.html → "Connecting a Real Backend" for the full API contract.
// ============================================

import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  tier: 'commercial',
  apiUrl: 'https://your-backend.example.com',   // ← Replace with your API URL
  wsUrl: 'wss://your-backend.example.com/ws',   // ← Replace with your WS URL
  mockMode: false,

  features: {
    // Data & connectivity
    backendIntegration:   true,
    realTimeWebSocket:    true,

    // AI capabilities — set to true after wiring your OpenAI / Anthropic API keys
    // See docs/setup-guide.html → "AI Provider Integration"
    realAiAgents:         false,
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

    // Advanced
    reportExport:         true,
    apiKeyManagement:     true,
    teamFeatures:         true,
    webhookIntegration:   true,

    // Always included
    errorDebugger:        true,
    agentBenchmarks:      true,
  },

  integrations: {
    orchestrationToStore: true,
    otelAutoSync:         true,
    complianceAutoSync:   true,
    outcomeMetricsSync:   true,
    costForecastRealTime: true,
    realAiAgents:         false,
    streamingResponses:   false,
    toolCalling:          false,
  },
};
