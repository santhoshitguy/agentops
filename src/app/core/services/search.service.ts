import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgentStateService } from './agent-state';
import { AlertService } from './alert.service';
import { SessionService } from './session.service';

// ============================================
// Search Types
// ============================================

export type SearchCategory = 'page' | 'agent' | 'alert' | 'session';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  route: string;
  iconLabel: string;   // short string for the icon badge (e.g. 'P', 'A')
  badge?: string;      // optional status/type badge text
  badgeColor?: string; // optional CSS color for badge
}

export interface RecentSearch {
  query: string;
  timestamp: number;
}

// ============================================
// All 20 app pages — static search data
// ============================================

const APP_PAGES: SearchResult[] = [
  { id: 'pg-dashboard',     title: 'Dashboard',              subtitle: 'Main overview of all agent activity',          category: 'page', route: '/dashboard-v1',           iconLabel: '⬡' },
  { id: 'pg-agent-monitor', title: 'Agent Monitor',          subtitle: 'Real-time agent status and live logs',         category: 'page', route: '/agent-monitor',          iconLabel: '⬡' },
  { id: 'pg-orchestration', title: 'Orchestration',          subtitle: 'Multi-agent workflow planning and execution',   category: 'page', route: '/orchestration',          iconLabel: '⬡' },
  { id: 'pg-agent-comm',    title: 'Agent Communication',    subtitle: 'Inter-agent message flows and matrix',         category: 'page', route: '/agent-communication',    iconLabel: '⬡' },
  { id: 'pg-session',       title: 'Session Replay',         subtitle: 'Replay and debug past agent sessions',         category: 'page', route: '/session-replay',         iconLabel: '⬡' },
  { id: 'pg-task-flows',    title: 'Task Flows',             subtitle: 'Chain-of-thought visualization and replay',    category: 'page', route: '/task-flows',             iconLabel: '⬡' },
  { id: 'pg-analytics',     title: 'Error Analytics',        subtitle: 'Error rates, heatmaps and retry analytics',    category: 'page', route: '/analytics',              iconLabel: '⬡' },
  { id: 'pg-tools',         title: 'Tool Analytics',         subtitle: 'Tool usage heatmaps and cost breakdown',       category: 'page', route: '/tool-analytics',         iconLabel: '⬡' },
  { id: 'pg-cost-opt',      title: 'Cost Optimizer',         subtitle: 'Smart routing and budget recommendations',     category: 'page', route: '/cost-optimizer',         iconLabel: '⬡' },
  { id: 'pg-cost-fc',       title: 'Cost Forecast',          subtitle: 'Budget projections and what-if scenarios',     category: 'page', route: '/cost-forecast',          iconLabel: '⬡' },
  { id: 'pg-compliance',    title: 'Compliance & Audit',     subtitle: 'GDPR, HIPAA, SOC2, PCI-DSS audit trails',     category: 'page', route: '/compliance-audit',       iconLabel: '⬡' },
  { id: 'pg-performance',   title: 'Agent Benchmarks',       subtitle: 'Performance benchmarks and live testing',      category: 'page', route: '/agent-performance',      iconLabel: '⬡' },
  { id: 'pg-hallucinations',title: 'Hallucination Detection',subtitle: 'Detect and categorize AI hallucinations',      category: 'page', route: '/hallucination-detection', iconLabel: '⬡' },
  { id: 'pg-otel',          title: 'OpenTelemetry',          subtitle: 'Distributed tracing and span waterfall',       category: 'page', route: '/opentelemetry',          iconLabel: '⬡' },
  { id: 'pg-outcomes',      title: 'Outcome Metrics',        subtitle: 'SLA compliance and business impact tracking',  category: 'page', route: '/outcome-metrics',        iconLabel: '⬡' },
  { id: 'pg-prompt',        title: 'Prompt Manager',         subtitle: 'Versioning, diffs and A/B testing',            category: 'page', route: '/prompt-manager',         iconLabel: '⬡' },
  { id: 'pg-workflow',      title: 'Workflow Canvas',        subtitle: 'Visual drag-and-drop workflow editor',         category: 'page', route: '/workflow-canvas',        iconLabel: '⬡' },
  { id: 'pg-playground',    title: 'Playground',             subtitle: 'Multi-model interactive testing',              category: 'page', route: '/playground',             iconLabel: '⬡' },
  { id: 'pg-settings',      title: 'Settings',               subtitle: 'API keys, billing, notifications, config',    category: 'page', route: '/settings',               iconLabel: '⬡' },
  { id: 'pg-alerts',        title: 'Alert History',          subtitle: 'All past and active system alerts',            category: 'page', route: '/alert-history',          iconLabel: '⬡' },
];

const RECENT_KEY = 'agentops-recent-searches';
const MAX_RECENT = 8;
const MAX_RESULTS = 20;

// ============================================
// SearchService
// Signal-based, aggregates live data from all services
// ============================================

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private agentState = inject(AgentStateService);
  private alertService = inject(AlertService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  // State signals
  private _query = signal('');
  private _isOpen = signal(false);
  private _selectedIndex = signal(-1);
  private _recentSearches = signal<RecentSearch[]>(this.loadRecentSearches());

  // Public readonly
  readonly query = this._query.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();
  readonly selectedIndex = this._selectedIndex.asReadonly();
  readonly recentSearches = this._recentSearches.asReadonly();

  // Computed: all matching results across all sources
  readonly results = computed<SearchResult[]>(() => {
    const q = this._query().toLowerCase().trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    // 1. Pages (always first)
    APP_PAGES.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q)
    ).forEach(p => results.push(p));

    // 2. Agents
    this.agentState.agents()
      .filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(a => results.push({
        id: `agent-${a.id}`,
        title: a.name,
        subtitle: `${a.type} · ${a.model}`,
        category: 'agent',
        route: '/agent-monitor',
        iconLabel: 'A',
        badge: a.status,
        badgeColor: a.status === 'active'
          ? 'var(--accent-success)'
          : a.status === 'error'
          ? 'var(--accent-error)'
          : 'var(--text-muted)',
      }));

    // 3. Alerts
    this.alertService.alerts()
      .filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach(a => results.push({
        id: `alert-${a.id}`,
        title: a.title,
        subtitle: a.message.length > 80 ? a.message.slice(0, 80) + '…' : a.message,
        category: 'alert',
        route: '/alert-history',
        iconLabel: '!',
        badge: a.severity,
        badgeColor: a.severity === 'critical'
          ? 'var(--accent-error)'
          : a.severity === 'warning'
          ? 'var(--accent-warning)'
          : 'var(--accent-primary)',
      }));

    // 4. Sessions
    this.sessionService.sessions()
      .filter(s =>
        (s.agentName ?? '').toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.agentType ?? '').toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach(s => results.push({
        id: `session-${s.id}`,
        title: `Session: ${s.agentName ?? s.id}`,
        subtitle: `${s.agentType ?? 'agent'} · ${s.status}`,
        category: 'session',
        route: '/session-replay',
        iconLabel: '▶',
        badge: s.status,
        badgeColor: s.status === 'completed'
          ? 'var(--accent-success)'
          : s.status === 'failed'
          ? 'var(--accent-error)'
          : 'var(--accent-primary)',
      }));

    return results.slice(0, MAX_RESULTS);
  });

  // Grouped by category (Map preserves insertion order)
  readonly groupedResults = computed<Map<SearchCategory, SearchResult[]>>(() => {
    const map = new Map<SearchCategory, SearchResult[]>();
    const order: SearchCategory[] = ['page', 'agent', 'alert', 'session'];

    // Initialize in order so Map preserves display sequence
    order.forEach(cat => {
      const items = this.results().filter(r => r.category === cat);
      if (items.length) map.set(cat, items);
    });

    return map;
  });

  // Flat list for keyboard-nav index tracking
  readonly flatResults = computed<SearchResult[]>(() => {
    const all: SearchResult[] = [];
    this.groupedResults().forEach(items => all.push(...items));
    return all;
  });

  readonly hasResults = computed(() => this.flatResults().length > 0);
  readonly showRecent = computed(() =>
    !this._query() && this._recentSearches().length > 0
  );

  // ============================================
  // Actions
  // ============================================

  open(): void {
    this._isOpen.set(true);
    this._query.set('');
    this._selectedIndex.set(-1);
  }

  close(): void {
    this._isOpen.set(false);
    this._query.set('');
    this._selectedIndex.set(-1);
  }

  setQuery(q: string): void {
    this._query.set(q);
    this._selectedIndex.set(-1);
  }

  moveSelection(direction: 'up' | 'down'): void {
    const total = this.flatResults().length;
    if (total === 0) return;
    this._selectedIndex.update(i => {
      if (direction === 'down') return Math.min(i + 1, total - 1);
      return Math.max(i - 1, 0);
    });
  }

  selectCurrent(): void {
    const idx = this._selectedIndex();
    const results = this.flatResults();
    if (idx >= 0 && idx < results.length) {
      this.navigateTo(results[idx]);
    }
  }

  navigateTo(result: SearchResult): void {
    const q = this._query().trim();
    if (q) this.saveRecentSearch(q);
    this.close();
    this.router.navigate([result.route]);
  }

  searchRecent(query: string): void {
    this._query.set(query);
    this._selectedIndex.set(-1);
  }

  // ============================================
  // Category display helpers
  // ============================================

  getCategoryLabel(cat: SearchCategory): string {
    const labels: Record<SearchCategory, string> = {
      page: 'Pages',
      agent: 'Agents',
      alert: 'Alerts',
      session: 'Sessions',
    };
    return labels[cat];
  }

  // Global index of a result item (for keyboard highlight)
  getGlobalIndex(category: SearchCategory, localIndex: number): number {
    let offset = 0;
    for (const [cat, items] of this.groupedResults().entries()) {
      if (cat === category) return offset + localIndex;
      offset += items.length;
    }
    return -1;
  }

  isItemSelected(category: SearchCategory, localIndex: number): boolean {
    return this.getGlobalIndex(category, localIndex) === this._selectedIndex();
  }

  // ============================================
  // Recent Searches
  // ============================================

  private saveRecentSearch(query: string): void {
    const existing = this._recentSearches().filter(r => r.query !== query);
    const updated = [{ query, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
    this._recentSearches.set(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Storage may be unavailable
    }
  }

  private loadRecentSearches(): RecentSearch[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
