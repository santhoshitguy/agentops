import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogEntry, LogLevel } from '../../../core/models/agent.model';

// ============================================
// Terminal Panel Component
// Live-Streaming Logs with Syntax Highlighting
// ============================================

@Component({
  selector: 'app-terminal-panel',
  imports: [],
  templateUrl: './terminal-panel.html',
  styleUrl: './terminal-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalPanel {
  @ViewChild('outputContainer') outputContainer!: ElementRef<HTMLDivElement>;

  @Input() set logs(value: LogEntry[]) { this.logsSignal.set(value); }
  @Input() set panelTitle(value: string) { this.titleSignal.set(value); }
  @Input() set streaming(value: boolean) { this.streamingSignal.set(value); }
  @Input() set status(value: 'connected' | 'connecting' | 'disconnected') {
    this.connectionStatusSignal.set(value);
  }

  @Output() clearLogs = new EventEmitter<void>();
  @Output() downloadLogs = new EventEmitter<void>();
  @Output() expandChange = new EventEmitter<boolean>();

  // Signals
  private logsSignal = signal<LogEntry[]>([]);
  private titleSignal = signal('Agent Terminal');
  private streamingSignal = signal(false);
  private connectionStatusSignal = signal<'connected' | 'connecting' | 'disconnected'>('connected');
  private expandedSignal = signal(false);
  private autoScrollSignal = signal(true);
  private searchQuerySignal = signal('');
  private activeLevelsSignal = signal<Set<LogLevel>>(new Set(['info', 'success', 'warning', 'error', 'debug']));

  // Exposed computed
  title = computed(() => this.titleSignal());
  isStreaming = computed(() => this.streamingSignal());
  connectionStatus = computed(() => this.connectionStatusSignal());
  isExpanded = computed(() => this.expandedSignal());
  autoScroll = computed(() => this.autoScrollSignal());
  searchQuery = computed(() => this.searchQuerySignal());
  totalLogs = computed(() => this.logsSignal().length);

  // Log levels for filter
  logLevels: LogLevel[] = ['info', 'success', 'warning', 'error', 'debug'];

  // Filtered logs
  filteredLogs = computed(() => {
    const logs = this.logsSignal();
    const activeLevels = this.activeLevelsSignal();
    const query = this.searchQuerySignal().toLowerCase();

    return logs.filter(log => {
      const levelMatch = activeLevels.has(log.level);
      const searchMatch = !query ||
        log.message.toLowerCase().includes(query) ||
        log.agentName.toLowerCase().includes(query);
      return levelMatch && searchMatch;
    });
  });

  constructor() {
    // Auto-scroll effect
    effect(() => {
      if (this.autoScroll() && this.filteredLogs().length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  isLevelActive(level: LogLevel): boolean {
    return this.activeLevelsSignal().has(level);
  }

  toggleLevel(level: LogLevel): void {
    this.activeLevelsSignal.update(levels => {
      const newLevels = new Set(levels);
      if (newLevels.has(level)) {
        newLevels.delete(level);
      } else {
        newLevels.add(level);
      }
      return newLevels;
    });
  }

  getLevelCount(level: LogLevel): number {
    return this.logsSignal().filter(log => log.level === level).length;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  highlightMessage(message: string): string {
    const query = this.searchQuerySignal();
    let highlighted = message;

    // Highlight search query
    if (query) {
      const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
    }

    // Syntax highlighting
    highlighted = highlighted
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="keyword">$1</span>')
      .replace(/(https?:\/\/[^\s]+)/g, '<span class="url">$1</span>');

    return highlighted;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuerySignal.set(input.value);
  }

  onClear(): void {
    this.clearLogs.emit();
  }

  onDownload(): void {
    this.downloadLogs.emit();
  }

  toggleAutoScroll(): void {
    this.autoScrollSignal.update(v => !v);
  }

  toggleExpand(): void {
    this.expandedSignal.update(v => !v);
    this.expandChange.emit(this.expandedSignal());
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.outputContainer?.nativeElement) {
        const container = this.outputContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
