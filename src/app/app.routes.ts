import { Routes } from '@angular/router';
import { Layout } from './layout/layout/layout';
import { authGuard } from './core/guards/auth.guard';

// Helper: loads the Pro Upgrade gate for locked modules
const proUpgrade = (featureName: string, featureDescription: string) => ({
    loadComponent: () =>
        import('./features/pro-upgrade/pro-upgrade.component').then(
            (m) => m.ProUpgradeComponent,
        ),
    data: { featureName, featureDescription },
});

export const routes: Routes = [
    // ── Auth routes (outside Layout, no auth guard) ──────────────────────────
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () =>
                    import('./features/auth/login/login').then(m => m.Login),
            },
            {
                path: 'register',
                loadComponent: () =>
                    import('./features/auth/register/register').then(m => m.Register),
            },
            {
                path: 'mfa',
                loadComponent: () =>
                    import('./features/auth/mfa/mfa').then(m => m.Mfa),
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
    },

    // ── Authenticated shell (Layout + AuthGuard) ─────────────────────────────
    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard-v1', pathMatch: 'full' },

            // ── FREE modules ─────────────────────────────────────────────────
            {
                path: 'dashboard-v1',
                loadComponent: () => import('./features/dashboardv1/dashboardv1').then((m) => m.Dashboardv1),
            },
            {
                path: 'agent-monitor',
                loadComponent: () => import('./features/agent-monitor/agent-monitor').then((m) => m.AgentMonitor),
            },
            {
                path: 'playground',
                loadComponent: () => import('./features/playground/playground.component').then((m) => m.PlaygroundComponent),
            },

            // ── PRO-LOCKED modules (CORE) ─────────────────────────────────────
            {
                path: 'orchestration',
                ...proUpgrade(
                    'Orchestration',
                    'Visualize and control multi-agent workflows in real time. Coordinate task delegation, monitor agent pipelines, and debug execution graphs.',
                ),
            },
            {
                path: 'agent-communication',
                ...proUpgrade(
                    'Agent Communication',
                    'Inspect every message exchanged between agents. Explore communication graphs, trace inter-agent calls, and audit message payloads.',
                ),
            },
            {
                path: 'session-replay',
                ...proUpgrade(
                    'Session Replay',
                    'Replay any agent session step-by-step. Scrub through decisions, tool calls, and state changes to debug complex behaviours.',
                ),
            },
            {
                path: 'task-flows',
                ...proUpgrade(
                    'Task Flows',
                    'Model and visualize task dependency graphs. See how tasks branch, merge, and resolve across your agent network.',
                ),
            },

            // ── PRO-LOCKED modules (INSIGHTS) ─────────────────────────────────
            {
                path: 'analytics',
                ...proUpgrade(
                    'Error Analytics',
                    'Aggregate, classify, and drill into every agent error. Identify patterns, root causes, and error hotspots across runs.',
                ),
            },
            {
                path: 'tool-analytics',
                ...proUpgrade(
                    'Tool Analytics',
                    'Measure tool usage frequency, latency, and failure rates. Optimise which tools your agents call and when.',
                ),
            },
            {
                path: 'cost-optimizer',
                ...proUpgrade(
                    'Cost Optimizer',
                    'Cut LLM spend without cutting performance. Get per-agent cost breakdowns, model swap recommendations, and savings simulations.',
                ),
            },
            {
                path: 'cost-forecast',
                ...proUpgrade(
                    'Cost Forecast',
                    'Project future token and API costs based on usage trends. Plan budgets and spot cost spikes before they hit.',
                ),
            },
            {
                path: 'compliance-audit',
                ...proUpgrade(
                    'Compliance & Audit',
                    'Meet regulatory and internal governance requirements. Full audit logs, data-access heatmaps, and risk score dashboards.',
                ),
            },
            {
                path: 'agent-performance',
                ...proUpgrade(
                    'Agent Performance',
                    'Benchmark every agent across latency, throughput, accuracy, and SLA metrics. Spot regressions before they reach production.',
                ),
            },
            {
                path: 'hallucination-detection',
                ...proUpgrade(
                    'Hallucination Detection',
                    'AI-powered ground-truth diffing to surface hallucinations and factual drift. Quantify confidence and flag unreliable outputs automatically.',
                ),
            },
            {
                path: 'opentelemetry',
                ...proUpgrade(
                    'OpenTelemetry',
                    'Export traces, metrics, and logs to any OTel-compatible backend. Deep integration with Jaeger, Grafana, Datadog, and more.',
                ),
            },
            {
                path: 'outcome-metrics',
                ...proUpgrade(
                    'Outcome Metrics',
                    'Track business-level KPIs tied to agent outcomes. Go beyond token counts — measure goal completion, success rates, and ROI.',
                ),
            },
            {
                path: 'alert-history',
                ...proUpgrade(
                    'Alert History',
                    'Full timeline of every alert fired across your agent fleet. Filter, search, and correlate incidents to prevent recurrence.',
                ),
            },

            // ── PRO-LOCKED modules (TOOLS) ────────────────────────────────────
            {
                path: 'prompt-manager',
                ...proUpgrade(
                    'Prompt Manager',
                    'Version, test, and A/B-compare prompts at scale. Ship better prompts faster with built-in evaluation and rollback.',
                ),
            },
            {
                path: 'workflow-canvas',
                ...proUpgrade(
                    'Workflow Canvas',
                    'Build and iterate on agent workflows with a visual drag-and-drop canvas. Export to code or deploy directly from the UI.',
                ),
            },

            // ── PRO-LOCKED modules (SYSTEM) ───────────────────────────────────
            {
                path: 'settings',
                ...proUpgrade(
                    'Settings',
                    'Configure integrations, team access, API keys, notification rules, and advanced system preferences.',
                ),
            },
        ],
    },

    // ── Catch-all → 404 Not Found ─────────────────────────────────────────────
    {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFound),
    },
];
