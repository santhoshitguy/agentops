# AgentOps Lite — AI Agent Operations Dashboard

> A free Angular 21 admin dashboard template for monitoring and interacting with AI agents. Built for developers and indie teams exploring LLM-powered agent systems.

![Angular](https://img.shields.io/badge/Angular-21-red?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-Free%20(Personal%20Use)-brightgreen?style=flat-square)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)

---

## Overview

AgentOps Lite gives developers a ready-to-run Angular 21 dashboard for monitoring AI agents and experimenting with LLMs. It ships with 3 fully implemented feature pages, 31 shared components, and a complete dark neon design system — all pre-wired with realistic mock data so the dashboard runs and demos beautifully out of the box.

> **Want the full suite?** [AgentOps Pro](#upgrade-to-agentops-pro) unlocks 20 additional pages covering compliance, cost intelligence, session replay, orchestration, hallucination detection, prompt versioning, and more.

---

## Feature Pages

### ✅ Included in Lite (3 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard-v1` | Executive overview — active agents, live cost burn, error rates, recent executions |
| **Agent Monitor** | `/agent-monitor` | Real-time agent status grid with live execution feeds and health indicators |
| **Playground** | `/playground` | Interactive LLM sandbox — select model, tune parameters, send prompts, view streamed responses |

### Authentication

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/auth/login` | Email/password login with demo mode, animated neon background, remember me |
| **Register** | `/auth/register` | Account creation with password strength meter and confirmation |
| **MFA / OTP** | `/auth/mfa` | 6-digit OTP with auto-advance inputs, paste support, and countdown resend timer |

---

### 🔒 Pro-Only Pages (20 Pages)

#### Core Monitoring

| Page | Route |
|------|-------|
| **Orchestration** | `/orchestration` |
| **Agent Communication** | `/agent-communication` |
| **Session Replay** | `/session-replay` |
| **Task Flows** | `/task-flows` |

#### Analytics & Insights

| Page | Route |
|------|-------|
| **Error Analytics** | `/analytics` |
| **Tool Analytics** | `/tool-analytics` |
| **Cost Optimizer** | `/cost-optimizer` |
| **Cost Forecast** | `/cost-forecast` |
| **Outcome Metrics** | `/outcome-metrics` |
| **Agent Benchmarks** | `/agent-performance` |
| **Alert History** | `/alert-history` |

#### Compliance & Quality

| Page | Route |
|------|-------|
| **Compliance & Audit** | `/compliance-audit` |
| **Hallucination Detection** | `/hallucination-detection` |
| **OpenTelemetry** | `/opentelemetry` |

#### Developer Tools

| Page | Route |
|------|-------|
| **Prompt Manager** | `/prompt-manager` |
| **Workflow Canvas** | `/workflow-canvas` |
| **Settings** | `/settings` |

---

## Upgrade to AgentOps Pro

AgentOps Pro unlocks all 23 pages, including:

- 🔍 **Session Replay** — Step-by-step playback of any past agent session with full decision trace
- 💰 **Cost Intelligence** — Live spend accumulation, 30-day projections, and model-switching recommendations
- 🛡️ **Hallucination Detection** — Confidence scoring, ground-truth diff viewer, and per-agent risk history
- 📋 **Compliance & Audit** — Auto-generated compliance events linked directly to OpenTelemetry trace IDs
- 🧪 **Prompt Manager** — Version history, A/B testing, and per-variant token/cost analytics
- 🕸️ **Orchestration & Task Flows** — Multi-agent plan visualization and DAG-based pipeline views
- 📡 **OpenTelemetry** — Full span waterfall, trace explorer, and distributed tracing integration
- ⚙️ **Workflow Canvas** — Visual node editor for building and simulating multi-step agent workflows
- ...and much more

---

## Key Capabilities

### Real-Time Agent Monitoring
Live WebSocket feed drives the agent status grid, execution counter, and notification system. The mock server (`mock-server/`) generates realistic events so the dashboard runs fully offline for demos and development.

### Global Search (⌘K / Ctrl+K)
Command-palette style overlay searches across agents, pages, alerts, and sessions simultaneously. Keyboard-navigable with recent search history, category grouping, and inline text highlighting.

### LLM Playground
Interactive sandbox to send prompts to any configured model, tune temperature and parameters, and view streamed responses in real time — ideal for prompt experimentation and model comparison.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 |
| Language | TypeScript 5.9 |
| State | Angular Signals (`signal()`, `computed()`, `effect()`) |
| HTTP | Angular `HttpClient` with `withFetch()` |
| Styling | SCSS with 150+ CSS custom property design tokens |
| Icons | Lucide Angular |
| Charts | Chart.js 4 + ng2-charts, ngx-charts, D3.js |
| Graph rendering | ngx-graph (Swimlane) |
| Real-time | WebSocket via custom `WebSocketService` |
| Testing | Vitest |
| Build | Angular CLI 21 / `@angular/build:application` (esbuild) |

### Design Patterns

- **Standalone components** throughout — no NgModules
- **`ChangeDetectionStrategy.OnPush`** on every component
- **`inject()`** for dependency injection — no constructor parameters
- **`signal()` / `computed()` / `effect()`** for all reactive state
- **`@for` / `@if`** Angular 17+ control flow syntax
- **Lazy-loaded routes** — every feature page is a separate chunk
- **Barrel exports** — `shared/components/index.ts` for clean imports
- **Services** — `providedIn: 'root'`, private `signal()`, public `.asReadonly()`

### Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # auth.guard.ts, approval-pending-guard.ts
│   │   ├── models/          # 19 TypeScript interfaces
│   │   ├── services/        # 31 signal-based services
│   │   └── store/           # AgentStore
│   ├── features/            # Page components (lazy-loaded)
│   │   ├── auth/            # login / register / mfa
│   │   ├── dashboardv1/     # ✅ Included in Lite
│   │   ├── agent-monitor/   # ✅ Included in Lite
│   │   ├── playground/      # ✅ Included in Lite
│   │   └── ...              # 🔒 Pro-only pages
│   ├── layout/
│   │   ├── layout/          # Shell with Cmd+K listener
│   │   ├── header/          # Search trigger, notifications, user avatar
│   │   ├── sidebar/         # Collapsible nav with 4 sections
│   │   └── footer/
│   └── shared/
│       ├── components/      # 31 reusable components
│       └── pipes/           # RelativeTimePipe, TokenFormatPipe
├── environments/
│   ├── environment.model.ts # Shared interfaces (never replaced)
│   ├── environment.ts       # Dev: localhost:8081
│   └── environment.prod.ts  # Prod: your backend URL
└── styles/
    ├── _tokens.scss         # 150+ CSS custom properties
    ├── _mixins.scss         # Responsive + utility mixins
    ├── _animations.scss     # Keyframe library
    └── styles.scss          # Global resets and composition
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 11+

### Installation

```bash
git clone <repository-url>
cd agentops-lite
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200`.

**Demo credentials** (any non-empty values work in demo mode):
- Email: `demo@agentops.ai`
- Password: `demo123`

After login you are redirected to the MFA page — enter any 6-digit code to complete authentication.

### Production Build

```bash
ng build
# Output written to dist/agentops-ai/
```


### Development Build (with source maps)

```bash
ng build --configuration development
# or
npm run watch   # incremental rebuild on save
```

---

## Backend Integration

### Environment Configuration

All backend URLs and feature flags live in the environment files:

```typescript
// src/environments/environment.ts
export const environment: Environment = {
  apiUrl: 'http://localhost:8081',
  wsUrl: 'ws://localhost:8081/ws',
  mockMode: true,             // set to false to connect a real backend
  integrations: {
    realAiAgents: false,       // flip to true when backend is live
    streamingResponses: false,  // enable SSE streaming for Playground
    toolCalling: false,         // enable function calling pipeline
  },
};
```

### Expected API Endpoints

| Method | Endpoint | Consumer |
|--------|----------|---------|
| `POST` | `/api/models/execute` | Playground |
| `GET`  | `/api/models/list` | Playground |
| `WS`   | `/ws` | Agent Monitor real-time feed |

### WebSocket Event Contract

`WebSocketService` connects to `wsUrl` and dispatches typed events into `AgentStore`. Expected event envelope:

```json
{
  "type": "agent_status_update | execution_complete | cost_update | alert_triggered",
  "payload": { }
}
```

---

## Design System

### Color Tokens (Dark Neon Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#00e5ff` | Cyan — primary actions, active states |
| `--accent-secondary` | `#b388ff` | Purple — secondary, AI/ML indicators |
| `--accent-success` | `#00e676` | Green — success, online, healthy |
| `--accent-warning` | `#ff9100` | Orange — warnings, degraded |
| `--accent-error` | `#ff5252` | Red — errors, critical alerts |
| `--bg-primary` | `#060c16` | Deep navy — page background |
| `--bg-surface` | `#0e1c2a` | Card / panel surfaces |
| `--font-mono` | JetBrains Mono | Terminal, code, token displays |

Over 150 tokens cover spacing, typography, borders, shadows, z-indices, and component-specific values — all in `src/styles/_tokens.scss`.

### Shared Components (31 total)

| Component | Description |
|-----------|-------------|
| `StatusBadge` | Colored pill for agent/task status |
| `CostMeter` | Animated bar showing token cost |
| `TerminalStream` | Scrolling terminal-style live output |
| `DecisionTree` | Collapsible agent decision visualization |
| `ApprovalModal` | Human-in-the-loop approval dialog |
| `AlertBanner` | Dismissible alert with severity styling |
| `NotificationDropdown` | Bell icon with grouped notification list |
| `GlobalSearch` | Full-screen Cmd+K search overlay |
| `CircularGauge` | SVG donut gauge for percentages |
| `ConfidenceGauge` | Hallucination confidence score display |
| `SpanWaterfall` | OpenTelemetry trace timeline |
| `ExecutionTimeline` | Agent step-by-step timeline view |
| `FlowVisualization` | D3-powered execution flow graph |
| `AgentNetwork` | Force-directed agent topology graph |
| `CommunicationMatrix` | Inter-agent message frequency grid |
| `ToolCostBreakdown` | Stacked cost chart per tool call |
| `ToolUsageHeatmap` | Calendar-style usage heatmap |
| `MetricsPanel` | KPI card with trend sparkline |
| `WaveCanvas` | Animated canvas background |
| `SlaIndicator` | SLA compliance progress ring |
| `GoalProgressCard` | Outcome goal tracker card |
| `GroundTruthDiff` | Side-by-side text diff for hallucination review |
| `MessageTimeline` | Chronological agent message thread |
| `ExecutionStatsBar` | Token / latency / cost summary bar |
| `FlowReplayControls` | Play/pause/scrub controls for session replay |
| `FlowTimeline` | Scrollable event timeline for replay |
| `AgentNode` | Draggable node for workflow canvas |
| `AgentQueuePanel` | Live queue depth and position display |
| `TerminalPanel` | Full terminal emulator panel |
| `ToolDependencyGraph` | Tool call dependency DAG |

---

## Authentication

Demo mode accepts any non-empty credentials. The full flow:

1. **Login** (`/auth/login`) — Submit email/password → MFA pending state set
2. **MFA** (`/auth/mfa`) — Enter any 6-digit code → Authenticated, redirected to Dashboard
3. **Protected routes** — `AuthGuard` redirects unauthenticated requests to `/auth/login` with a `returnUrl` parameter
4. **Remember me** — Checked: auth state persisted to `localStorage`. Unchecked: cleared on tab close
5. **Logout** — Clears all auth state and redirects to `/auth/login`

Storage keys: `agentops-auth` (localStorage), `agentops-mfa-pending` (sessionStorage).

---

## Running Tests

```bash
ng test
```

Tests run with **Vitest** via the Angular test builder.

---

## Changelog

### v1.0.0

- 3 free feature pages: Dashboard, Agent Monitor, Playground
- 31 shared components with barrel exports
- Signal-based state management throughout (Angular Signals, no NgRx)
- Auth system (Login / Register / MFA) with `AuthGuard` and `returnUrl` support
- Global search (Cmd+K / Ctrl+K) across agents, pages, alerts, sessions
- Environment configuration with dev/prod profiles and feature flags
- WebSocket real-time simulation layer with mock server
- Complete dark neon design system (150+ CSS custom property tokens)

---

## License

Free for personal use. Commercial use, redistribution, or resale requires a commercial license.
See `LICENSE` for full terms.

---

## Support

For issues and feature requests, open a ticket in the project repository.
