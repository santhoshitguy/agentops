import { Injectable, signal, computed } from '@angular/core';

export type DataMode = 'mock' | 'live';
const STORAGE_KEY = 'agentops_data_mode';

// ============================================
// DataModeService
// Runtime toggle between mock seed data and live backend.
// Persisted to localStorage — survives page refresh.
// Services react to mode changes via effect() and reset
// themselves to SeedDataService data when mode → 'mock'.
// When mode → 'live' and no backend is reachable, services
// silently fall back to their current seed data (no errors shown).
// ============================================

@Injectable({ providedIn: 'root' })
export class DataModeService {
  private readonly _mode = signal<DataMode>(
    (localStorage.getItem(STORAGE_KEY) as DataMode | null) ?? 'mock'
  );

  // ── Public readonly signals ──────────────────────────────────────────────
  readonly mode   = this._mode.asReadonly();
  readonly isMock = computed(() => this._mode() === 'mock');
  readonly isLive = computed(() => this._mode() === 'live');

  // ── Mutations ────────────────────────────────────────────────────────────

  toggle(): void {
    this.setMode(this._mode() === 'mock' ? 'live' : 'mock');
  }

  setMode(mode: DataMode): void {
    this._mode.set(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* SSR / private browsing */ }
  }
}
