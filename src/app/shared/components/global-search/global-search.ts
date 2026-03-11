import {
  Component,
  ChangeDetectionStrategy,
  inject,
  HostListener,
  ViewChild,
  ElementRef,
  OnChanges,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  LucideAngularModule,
  Search,
  X,
  Clock,
  LayoutDashboard,
  Bot,
  Bell,
  Play,
  Settings,
  ChevronRight,
  Hash,
} from 'lucide-angular';
import { SearchService, SearchResult, SearchCategory } from '../../../core/services/search.service';

// ============================================
// GlobalSearch Component — Cmd+K overlay
// Triggered by parent (Layout) via SearchService
// Keyboard: ↑↓ navigate, Enter select, Esc close
// ============================================

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './global-search.html',
  styleUrl: './global-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearch {
  private searchService = inject(SearchService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  // Icons
  searchIcon = Search;
  xIcon = X;
  clockIcon = Clock;
  layoutIcon = LayoutDashboard;
  botIcon = Bot;
  bellIcon = Bell;
  playIcon = Play;
  settingsIcon = Settings;
  chevronIcon = ChevronRight;
  hashIcon = Hash;

  // Expose service signals directly to template
  readonly isOpen = this.searchService.isOpen;
  readonly query = this.searchService.query;
  readonly groupedResults = this.searchService.groupedResults;
  readonly flatResults = this.searchService.flatResults;
  readonly hasResults = this.searchService.hasResults;
  readonly showRecent = this.searchService.showRecent;
  readonly recentSearches = this.searchService.recentSearches;

  // Category display labels
  readonly categoryLabels: Record<SearchCategory, string> = {
    page: 'Pages',
    agent: 'Agents',
    alert: 'Alerts',
    session: 'Sessions',
  };

  // Auto-focus input when overlay opens
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        // Give Angular a tick to render the overlay before focusing
        setTimeout(() => {
          this.searchInputRef?.nativeElement?.focus();
        }, 60);
      }
    });
  }

  // ============================================
  // Template helpers
  // ============================================

  onQueryChange(event: Event): void {
    this.searchService.setQuery((event.target as HTMLInputElement).value);
  }

  clearQuery(): void {
    this.searchService.setQuery('');
    this.searchInputRef?.nativeElement?.focus();
  }

  close(): void {
    this.searchService.close();
  }

  selectResult(result: SearchResult): void {
    this.searchService.navigateTo(result);
  }

  onRecentClick(query: string): void {
    this.searchService.searchRecent(query);
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 10);
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('search-backdrop')) {
      this.close();
    }
  }

  isItemSelected(category: SearchCategory, localIndex: number): boolean {
    return this.searchService.isItemSelected(category, localIndex);
  }

  getCategoryLabel(cat: SearchCategory): string {
    return this.searchService.getCategoryLabel(cat);
  }

  // Highlight matching substring — returns SafeHtml with <mark> tags
  highlight(text: string): SafeHtml {
    const q = this.query().trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const marked = text.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark>$1</mark>'
    );
    return this.sanitizer.bypassSecurityTrustHtml(marked);
  }

  // Map entries iteration helper — returns array from Map for @for
  mapEntries(map: Map<SearchCategory, SearchResult[]>): Array<{ key: SearchCategory; value: SearchResult[] }> {
    const entries: Array<{ key: SearchCategory; value: SearchResult[] }> = [];
    map.forEach((value, key) => entries.push({ key, value }));
    return entries;
  }

  // ============================================
  // Keyboard listeners (global, only active when open)
  // ============================================

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }

  @HostListener('document:keydown.arrowdown', ['$event'])
  onArrowDown(event: Event): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.searchService.moveSelection('down');
    }
  }

  @HostListener('document:keydown.arrowup', ['$event'])
  onArrowUp(event: Event): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.searchService.moveSelection('up');
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event): void {
    if (this.isOpen() && this.flatResults().length > 0) {
      event.preventDefault();
      this.searchService.selectCurrent();
    }
  }
}
