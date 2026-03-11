import { Component, HostListener, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { AlertBanner } from '../../shared/components/alert-banner/alert-banner';
import { GlobalSearch } from '../../shared/components/global-search/global-search';
import { SearchService } from '../../core/services/search.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// ============================================
// Layout — authenticated app shell
// Hosts sidebar, header, router outlet, footer
// Also owns the GlobalSearch overlay (Cmd+K)
// ============================================

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Header, Footer, AlertBanner, GlobalSearch],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private routerSub?: Subscription;

  isSidebarExpanded = false;
  isMobileOpen = signal(false);

  ngOnInit(): void {
    // Close mobile sidebar on route change
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.isMobileOpen.set(false));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  // Called by hamburger button in header — opens mobile overlay drawer
  toggleMobileSidebar(): void {
    if (window.innerWidth < 1024) {
      this.isMobileOpen.update(v => !v);
    } else {
      this.toggleSidebar();
    }
  }

  closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  openSearch(): void {
    this.searchService.open();
  }

  // Cmd+K (Mac) / Ctrl+K (Windows/Linux) — toggle search overlay
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (this.searchService.isOpen()) {
        this.searchService.close();
      } else {
        this.searchService.open();
      }
    }
  }
}
