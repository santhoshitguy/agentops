import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  LayoutDashboard,
  Bot,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Network,
  Play,
  BarChart3,
  DollarSign,
  MessageSquare,
  Shield,
  Brain,
  Gauge,
  Workflow,
  Bell,
  HelpCircle,
  Wrench,
  GitBranch,
  AlertTriangle,
  Activity,
  Target,
  TrendingUp,
  Lock,
} from 'lucide-angular';
interface SidebarNavItem {
  id: string;
  label: string;
  icon: readonly (readonly [string, Record<string, string | number>])[];
  route: string;
  badge?: number | string;
  section?: string;
  pro?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LucideAngularModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  @Input() set collapsed(value: boolean) { this.collapsedSignal.set(value); }

  @Output() toggle = new EventEmitter<boolean>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Signals
  private collapsedSignal = signal(false);
  private isMobile = signal(typeof window !== 'undefined' && window.innerWidth <= 1023);

  // On mobile the drawer is always "expanded" — labels must be in the DOM
  isCollapsed = computed(() => this.collapsedSignal() && !this.isMobile());

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth <= 1023);
  }

  // User info
  userName = signal('Alex Johnson');
  userRole = signal('AI Operations Lead');
  userAvatar = signal('https://api.dicebear.com/7.x/avataaars/svg?seed=Alex');

  // System status
  activeAgents = signal(7);
  totalAgents = signal(12);
  uptime = signal('99.9%');

  // Icon references for template
  collapseIcon = ChevronsLeft;
  expandIcon = ChevronsRight;
  settingsIcon = Settings;
  bellIcon = Bell;
  helpIcon = HelpCircle;
  lockIcon = Lock;

  // Navigation items with Lucide icon data
  mainNav: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard-v1', section: 'CORE' },
    { id: 'agents', label: 'Agent Monitor', icon: Bot, route: '/agent-monitor', badge: 7, section: 'CORE' },
    { id: 'orchestration', label: 'Orchestration', icon: Network, route: '/orchestration', section: 'CORE', pro: true },
    { id: 'agent-communication', label: 'Agent Communication', icon: MessageSquare, route: '/agent-communication', section: 'CORE', pro: true },
    { id: 'replay', label: 'Session Replay', icon: Play, route: '/session-replay', section: 'CORE', pro: true },
    { id: 'task-flows', label: 'Task Flows', icon: GitBranch, route: '/task-flows', section: 'CORE', pro: true },
  ];

  analyticsNav: SidebarNavItem[] = [
    { id: 'analytics', label: 'Error Analytics', icon: BarChart3, route: '/analytics', section: 'INSIGHTS', pro: true },
    { id: 'tool-analytics', label: 'Tool Analytics', icon: Wrench, route: '/tool-analytics', section: 'INSIGHTS', pro: true },
    { id: 'cost', label: 'Cost Optimizer', icon: DollarSign, route: '/cost-optimizer', section: 'INSIGHTS', pro: true },
    { id: 'cost-forecast', label: 'Cost Forecast', icon: TrendingUp, route: '/cost-forecast', section: 'INSIGHTS', pro: true },
    { id: 'compliance-audit', label: 'Compliance & Audit', icon: Shield, route: '/compliance-audit', section: 'INSIGHTS', pro: true },
    { id: 'performance', label: 'Agent Performance', icon: Gauge, route: '/agent-performance', section: 'INSIGHTS', pro: true },
    { id: 'hallucinations', label: 'Hallucination Detect', icon: AlertTriangle, route: '/hallucination-detection', section: 'INSIGHTS', pro: true },
    { id: 'opentelemetry', label: 'OpenTelemetry', icon: Activity, route: '/opentelemetry', section: 'INSIGHTS', pro: true },
    { id: 'outcomes', label: 'Outcome Metrics', icon: Target, route: '/outcome-metrics', section: 'INSIGHTS', pro: true },
    { id: 'alert-history', label: 'Alert History', icon: Bell, route: '/alert-history', section: 'INSIGHTS', pro: true },
  ];

  toolsNav: SidebarNavItem[] = [
    { id: 'prompt-manager', label: 'Prompt Manager', icon: MessageSquare, route: '/prompt-manager', section: 'TOOLS', pro: true },
    { id: 'workflows', label: 'Workflow Canvas', icon: Workflow, route: '/workflow-canvas', section: 'TOOLS', pro: true },
    { id: 'playground', label: 'Playground', icon: Brain, route: '/playground', section: 'TOOLS' },
  ];

  systemNav: SidebarNavItem[] = [
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings', section: 'SYSTEM', pro: true },
  ];

  toggleCollapse(): void {
    this.collapsedSignal.update(c => !c);
    this.toggle.emit(this.collapsedSignal());
  }

  onSettingsClick(): void {
    this.settingsClick.emit();
  }
}
