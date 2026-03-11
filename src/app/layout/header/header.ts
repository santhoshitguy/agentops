import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  signal,
  HostListener,
  ElementRef,
} from '@angular/core';
import {
  LucideAngularModule,
  Menu,
  Search,
  Zap,
  ChevronDown,
  Database,
  Wifi,
  Settings,
  LogOut,
  Shield,
  Key,
  BookOpen,
  Monitor,
  User,
} from 'lucide-angular';
import { Router } from '@angular/router';
import { NotificationDropdown } from '../../shared/components/notification-dropdown/notification-dropdown';
import { DataModeService } from '../../core/services/data-mode.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { AuthService } from '../../core/services/auth.service';

// ============================================
// Header Component
// Top bar: sidebar toggle, search trigger, tier badge, mock/live toggle,
// status indicator, notifications, user avatar + dropdown
// ============================================

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule, NotificationDropdown],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openSearch = new EventEmitter<void>();

  readonly dataModeService = inject(DataModeService);
  readonly flags = inject(FeatureFlagService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);

  // ── Dropdown state ──────────────────────────────────────────
  readonly dropdownOpen = signal(false);

  // ── Icons ───────────────────────────────────────────────────
  menuIcon = Menu;
  searchIcon = Search;
  zapIcon = Zap;
  chevronIcon = ChevronDown;
  databaseIcon = Database;
  wifiIcon = Wifi;
  settingsIcon = Settings;
  logoutIcon = LogOut;
  shieldIcon = Shield;
  keyIcon = Key;
  docsIcon = BookOpen;
  monitorIcon = Monitor;
  userIcon = User;

  // ── Dropdown helpers ────────────────────────────────────────

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  /** Close dropdown when clicking outside the host element. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeDropdown();
  }

  toggleDataMode(event: MouseEvent): void {
    event.stopPropagation();
    this.dataModeService.toggle();
  }

  openDocs(event: MouseEvent): void {
    event.stopPropagation();
    window.open('docs/setup-guide.html', '_blank');
    this.closeDropdown();
  }

  logout(): void {
    this.closeDropdown();
    this.auth.logout();
  }
}
