# Changelog

All notable changes to **AgentOps Lite** are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-02-26

### Initial Marketplace Release

#### Features Added
- **Dashboard V1** — Real-time agent network visualization with canvas-based wave animations, live system metrics panel, and streaming terminal output
- **Agent Monitor** — Per-agent health monitoring, execution history timeline, performance graphs, and status badges
- **Orchestration** — Multi-agent plan management with DAG visualization, decision point resolution, and real-time task progression
- **Cost Optimizer** — Token burn rate tracking, smart model routing recommendations, budget caps, and ROI dashboard
- **Prompt Manager** — Git-like prompt versioning with diff viewer, A/B testing with traffic split control, automatic rollback, and performance heatmaps
- **Agent Performance** — Benchmark leaderboard, model comparison side-by-side, live testing console, and auto-scaling signals
- **Session Replay** — Step-through conversation debugger with scrubber timeline, flow replay controls, and export functionality
- **Hallucination Detection** — Real-time confidence scoring, source citation insertion, ground truth diff viewer, and uncertainty flagging
- **Playground** — Interactive LLM testing environment with streaming responses, multi-model comparison, tool calling simulation, and cost estimation
- **Compliance Audit** — PII detection scanner, GDPR/HIPAA/SOC2 ruleset support, audit log table, risk score badges, and data access heatmap

#### Additional Pages
- Agent Communication — Inter-agent message timeline and communication matrix
- Task Flows — Visual task execution flow viewer with step inspection
- Error Analytics — Error classification, root cause analysis, and pattern detection
- Cost Forecast — ML regression-based spend prediction with budget alert system
- OpenTelemetry — Distributed trace viewer with span waterfall visualization
- Outcome Metrics — SLA tracking dashboard with goal progress cards
- Workflow Canvas — No-code drag-and-drop agent workflow builder
- Alert History — Alert event timeline with acknowledgement and filter controls
- Tool Analytics — Tool usage heatmaps and dependency graph
- Settings — API key management, notification preferences, profile settings

#### Core Architecture
- Angular 21 standalone components throughout
- Signal-based reactive state management (`signal()`, `computed()`, `effect()`)
- `ChangeDetectionStrategy.OnPush` on all components for 60fps performance
- Lazy-loaded routes for all 21 feature pages
- `providedIn: 'root'` singleton services with readonly signal exposure
- Full mock data layer — runs without any backend (SeedDataService, WebSocketService mock mode)
- Multi-tier environment configuration (development, production, themeforest, standard, commercial)

#### Design System
- Dark neon theme with CSS custom properties (design tokens in `_tokens.scss`)
- Glassmorphism UI elements with backdrop blur
- Glowing effects and neon accents (cyan, green, purple, orange, pink)
- Canvas-based 60fps wave animations with particle effects
- SVG agent nodes with gradient fills and glow effects
- Lucide icon system (300+ icons)
- Responsive grid layouts (desktop, tablet, mobile)
- Custom typography: Inter, Rajdhani, Fira Code

#### Shared Component Library (30 components)
- WaveCanvas, AgentNetwork, AgentNode, FlowVisualization
- CircularGauge, ConfidenceGauge, CostMeter, MetricsPanel
- TerminalPanel, TerminalStream
- DecisionTree, ApprovalModal, AlertBanner
- StatusBadge, SLAIndicator, GoalProgressCard
- NotificationDropdown, GlobalSearch (Cmd+K)
- SpanWaterfall, CommunicationMatrix, MessageTimeline
- FlowTimeline, FlowReplayControls
- ToolDependencyGraph, ToolUsageHeatmap
- ExecutionStatsBar, AgentQueuePanel, GroundTruthDiff

#### Infrastructure
- AgentStore — centralized signal store for agents, executions, flows, tools, network
- WebSocketService — real/mock WebSocket with reconnection and event routing
- ApiDataBridgeService — seamless mock ↔ live data switching
- AuthService — API-driven auth (login, register, MFA) with token management
- 18 TypeScript model files for full type safety

---

## Upcoming (v1.1.0 — Roadmap)

- Context Window Manager — Visual context usage bar with compression warnings
- Brand Voice Enforcer — Tone analyzer and vocabulary enforcement
- Cross-Platform Provider Hub — Unified OpenAI / Anthropic / Google / Azure comparison
- Dark/Light theme toggle
- Additional chart types and visualization components
