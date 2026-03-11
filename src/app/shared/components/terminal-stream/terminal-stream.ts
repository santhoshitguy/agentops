import {
  Component,
  Input,
  computed,
  signal,
  effect,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LogEntry, LogLevel } from '../../../core/models/agent.model';

// ============================================
// Terminal Stream Component
// Terminal-style log viewer with auto-scroll
// ============================================

@Component({
  selector: 'app-terminal-stream',
  imports: [CommonModule, DatePipe],
  templateUrl: './terminal-stream.html',
  styleUrl: './terminal-stream.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerminalStream implements AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  @Input() set logs(v: LogEntry[]) { this.logsSignal.set(v); }
  @Input() set streaming(v: boolean) { this.streamingSignal.set(v); }
  @Input() set maxLines(v: number) { this.maxLinesSignal.set(v); }

  private logsSignal = signal<LogEntry[]>([]);
  private streamingSignal = signal(false);
  private maxLinesSignal = signal(200);
  private autoScrollSignal = signal(true);
  private shouldScroll = false;

  isStreaming = computed(() => this.streamingSignal());
  autoScroll = computed(() => this.autoScrollSignal());

  visibleLogs = computed(() => {
    const logs = this.logsSignal();
    const max = this.maxLinesSignal();
    return logs.length > max ? logs.slice(logs.length - max) : logs;
  });

  logCount = computed(() => this.logsSignal().length);

  constructor() {
    // Mark that we need to scroll when logs change
    effect(() => {
      this.visibleLogs(); // subscribe to changes
      if (this.autoScrollSignal()) {
        this.shouldScroll = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  levelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      info: '#00d4ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      debug: '#6b7280'
    };
    return colors[level];
  }

  levelPrefix(level: LogLevel): string {
    const prefixes: Record<LogLevel, string> = {
      info: 'INF',
      success: 'OK ',
      warning: 'WRN',
      error: 'ERR',
      debug: 'DBG'
    };
    return prefixes[level];
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    this.autoScrollSignal.set(atBottom);
  }

  scrollToBottom(): void {
    this.autoScrollSignal.set(true);
    this.shouldScroll = true;
  }

  trackById(_index: number, log: LogEntry): string {
    return log.id;
  }
}
