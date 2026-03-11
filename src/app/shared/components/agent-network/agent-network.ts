import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { NetworkNode, NetworkConnection } from '../../../core/models/agent.model';

// ============================================
// Agent Network Graph Component
// Interactive Node Graph with Animated Wave Connections
// ============================================

@Component({
  selector: 'app-agent-network',
  imports: [],
  templateUrl: './agent-network.html',
  styleUrl: './agent-network.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentNetwork {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  @Input() set networkNodes(value: NetworkNode[]) { this.nodesSignal.set(value); }
  @Input() set networkConnections(value: NetworkConnection[]) { this.connectionsSignal.set(value); }
  @Input() width = 600;
  @Input() height = 450;
  @Input() nodeScale = 1;
  @Input() hideHeader = false;

  @Output() nodeClick = new EventEmitter<NetworkNode>();
  @Output() nodeHoverChange = new EventEmitter<{ node: NetworkNode; hovered: boolean }>();
  @Output() minimizeClick = new EventEmitter<void>();
  @Output() closeClick = new EventEmitter<void>();

  private nodesSignal = signal<NetworkNode[]>([]);
  private connectionsSignal = signal<NetworkConnection[]>([]);

  nodes = this.nodesSignal.asReadonly();
  connections = this.connectionsSignal.asReadonly();

  viewBox = computed(() => `0 0 ${this.width} ${this.height}`);

  // Status counts for the header bar
  activeCount = computed(() => this.nodes().filter(n => n.status === 'active').length);
  processingCount = computed(() => this.nodes().filter(n => n.status === 'processing').length);
  idleCount = computed(() => this.nodes().filter(n => n.status === 'idle' || n.status === 'error').length);

  // Grid lines for subtle background
  gridLines = computed(() => {
    const lines: number[] = [];
    for (let i = 0; i <= Math.max(this.width, this.height); i += 40) {
      lines.push(i);
    }
    return lines;
  });

  // Node colors mapping
  private nodeColors: Record<string, { main: string; fill: string; glow: string }> = {
    orchestrator: { main: '#00e5ff', fill: 'rgba(0, 229, 255, 0.15)', glow: 'cyan' },
    goal: { main: '#00e676', fill: 'rgba(0, 230, 118, 0.15)', glow: 'green' },
    uclam: { main: '#b388ff', fill: 'rgba(179, 136, 255, 0.15)', glow: 'purple' },
    researcher: { main: '#ff4081', fill: 'rgba(255, 64, 129, 0.15)', glow: 'pink' },
    scorer: { main: '#ff9100', fill: 'rgba(255, 145, 0, 0.15)', glow: 'orange' },
    writer: { main: '#40c4ff', fill: 'rgba(64, 196, 255, 0.15)', glow: 'lightblue' },
    coder: { main: '#00e676', fill: 'rgba(0, 230, 118, 0.15)', glow: 'green' },
    reviewer: { main: '#ffea00', fill: 'rgba(255, 234, 0, 0.15)', glow: 'yellow' }
  };

  // Status color mapping
  private statusColors: Record<string, string> = {
    active: '#00e676',
    idle: '#ff9100',
    processing: '#00e5ff',
    error: '#ff5252'
  };

  // Node type icons (24x24 viewBox, Lucide-style paths scaled to 20x20)
  private nodeIcons: Record<string, string> = {
    orchestrator: 'M5 2l5 5-5 5M5 12l5 5-5 5M15 2l-5 5 5 5M15 12l-5 5 5 5',
    goal: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    uclam: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2',
    researcher: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    scorer: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6M13 19V9a2 2 0 012-2h2a2 2 0 012 2v10M21 19V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14',
    writer: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    coder: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    reviewer: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
  };

  ngAfterViewInit(): void {
    // Canvas or D3 initialization if needed
  }

  ngOnDestroy(): void { }

  getNodeColor(type: string): string {
    return this.nodeColors[type]?.main || '#ffffff';
  }

  getNodeFill(type: string): string {
    return this.nodeColors[type]?.fill || 'rgba(255,255,255,0.1)';
  }

  getGlowType(type: string): string {
    return this.nodeColors[type]?.glow || 'cyan';
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || '#ff9100';
  }

  getNodeIcon(type: string): string {
    return this.nodeIcons[type] || this.nodeIcons['orchestrator'];
  }

  // Scaled radius helpers for nodeScale input
  get r_ambient(): number { return 40 * this.nodeScale; }
  get r_pulse(): number { return 36 * this.nodeScale; }
  get r_pulseMax(): number { return 48 * this.nodeScale; }
  get r_outer(): number { return 38 * this.nodeScale; }
  get r_main(): number { return 32 * this.nodeScale; }
  get r_highlight(): number { return 28 * this.nodeScale; }
  get r_shine(): number { return 16 * this.nodeScale; }
  get r_processing(): number { return 35 * this.nodeScale; }
  get shine_offset(): number { return -6 * this.nodeScale; }
  get icon_offset(): number { return -10 * this.nodeScale; }
  get icon_size(): number { return 20 * this.nodeScale; }
  get label_y(): number { return 52 * this.nodeScale; }
  get model_y(): number { return 65 * this.nodeScale; }
  get status_cx(): number { return 22 * this.nodeScale; }
  get status_cy(): number { return -22 * this.nodeScale; }
  get status_r(): number { return 5 * this.nodeScale; }
  get status_glow_r(): number { return 8 * this.nodeScale; }

  getConnectionColor(conn: NetworkConnection): string {
    const fromNode = this.nodes().find(n => n.id === conn.from);
    return fromNode ? this.getNodeColor(fromNode.type) : '#ffffff';
  }

  getConnectionPath(conn: NetworkConnection): string {
    const from = this.nodes().find(n => n.id === conn.from);
    const to = this.nodes().find(n => n.id === conn.to);

    if (!from || !to) return '';

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Wave-style curvature
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = dist * 0.25;
    const perpX = (-dy / dist) * curvature;
    const perpY = (dx / dist) * curvature;

    const cx = midX + perpX * 0.4;
    const cy = midY + perpY * 0.4;

    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  }

  // Wave particle animation timing (staggered)
  getParticleDuration(index: number): string {
    return `${1.6 + index * 0.3}s`;
  }

  getParticleDelay(index: number): string {
    return `${index * 0.4}s`;
  }

  onNodeClick(node: NetworkNode): void {
    this.nodeClick.emit(node);
  }

  onNodeHover(node: NetworkNode, hovered: boolean): void {
    this.nodeHoverChange.emit({ node, hovered });
  }

  onMinimize(): void {
    this.minimizeClick.emit();
  }

  onClose(): void {
    this.closeClick.emit();
  }
}
