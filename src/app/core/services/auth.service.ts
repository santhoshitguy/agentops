/**
 * auth.service.ts — Signal-based authentication service backed by real backend JWT.
 *
 * Replaces the previous demo-only implementation with real HTTP calls to:
 *   POST /api/auth/login
 *   POST /api/auth/mfa/verify
 *   POST /api/auth/register
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *
 * Token storage:
 *   agentops-access-token  → localStorage (60-min JWT, sent as Bearer header by ApiService)
 *   agentops-refresh-token → localStorage (7-day token for silent renewal)
 *   agentops-auth          → localStorage (serialised user object for page reload)
 *
 * MFA flow:
 *   login() detects requires_mfa=true from backend → sets mfaPending=true
 *   completeMfaLogin(email, code) → POST /api/auth/mfa/verify
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DataModeService } from './data-mode.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

/** Shape of POST /api/auth/login response */
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
  };
  requires_mfa?: boolean;
}

/** Shape of POST /api/auth/register response */
interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'agentops-access-token';
const REFRESH_TOKEN_KEY = 'agentops-refresh-token';
const USER_STORAGE_KEY = 'agentops-auth';
const MFA_KEY = 'agentops-mfa-pending';

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private dataMode = inject(DataModeService);

  /** Returns the mock server URL when in mock mode, real backend URL otherwise. */
  private get baseUrl(): string {
    return this.dataMode.isMock() && environment.mockServerUrl
      ? environment.mockServerUrl
      : environment.apiUrl;
  }

  // Private writable signals
  private _isAuthenticated = signal<boolean>(false);
  private _user = signal<AuthUser | null>(null);
  private _token = signal<string | null>(null);
  private _mfaPending = signal<boolean>(false);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly mfaPending = this._mfaPending.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed helpers
  readonly displayName = computed(() => this._user()?.name ?? '');
  readonly userAvatar = computed(() => this._user()?.avatar ?? '');
  readonly userRole = computed(() => this._user()?.role ?? '');
  readonly userEmail = computed(() => this._user()?.email ?? '');

  constructor() {
    this.loadFromStorage();
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/login
   * On success: stores tokens + user, navigates to /dashboard-v1.
   * If requires_mfa: sets mfaPending=true, stores email in sessionStorage.
   */
  login(email: string, password: string, remember: boolean): Observable<boolean> {
    if (!email?.trim() || !password?.trim()) {
      this._error.set('Email and password are required');
      return of(false);
    }

    // ── Mock / demo mode: bypass HTTP, return a fake session ──────────────
    if (this.dataMode.isMock() && (!environment.apiUrl || environment.mockMode)) {
      const mockUser: AuthUser = {
        id: 'demo-001',
        name: 'Alex Johnson',
        email: email,
        role: 'admin',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      };
      const mockToken = 'mock-demo-token';
      localStorage.setItem(ACCESS_TOKEN_KEY, mockToken);
      if (remember) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ user: mockUser, token: mockToken }));
      }
      this._user.set(mockUser);
      this._token.set(mockToken);
      this._isAuthenticated.set(true);
      this.router.navigate(['/dashboard-v1']);
      return of(true);
    }
    // ──────────────────────────────────────────────────────────────────────
    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this._loading.set(false);

          if (response.requires_mfa) {
            // MFA required — store pending state for completeMfaLogin()
            this._mfaPending.set(true);
            sessionStorage.setItem(MFA_KEY, JSON.stringify({ email, remember }));
            return;
          }

          // Full login success
          this._storeSession(response, remember);
          this.router.navigate(['/dashboard-v1']);
        }),
        catchError(err => {
          this._loading.set(false);
          this._error.set(err.error?.detail ?? 'Invalid email or password');
          return of(false);
        }),
      ) as Observable<boolean>;
  }

  // ── MFA Verify ─────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/mfa/verify
   * Called after login() set mfaPending=true.
   * On success: stores tokens + user, navigates to /dashboard-v1.
   */
  completeMfaLogin(mfaCode: string): Observable<boolean> {
    const raw = sessionStorage.getItem(MFA_KEY);
    const { email, remember } = raw
      ? (JSON.parse(raw) as { email: string; remember: boolean })
      : { email: '', remember: false };

    if (!email) {
      this._error.set('MFA session expired. Please log in again.');
      return of(false);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/auth/mfa/verify`, {
        email,
        mfa_code: mfaCode,
      })
      .pipe(
        tap(response => {
          this._loading.set(false);
          sessionStorage.removeItem(MFA_KEY);
          this._mfaPending.set(false);
          this._storeSession(response, remember);
          this.router.navigate(['/dashboard-v1']);
        }),
        catchError(err => {
          this._loading.set(false);
          this._error.set(err.error?.detail ?? 'Invalid MFA code');
          return of(false);
        }),
      ) as Observable<boolean>;
  }

  // ── Register ───────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   * On success: redirects to /auth/login.
   */
  register(name: string, email: string, password: string, username?: string): Observable<boolean> {
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      this._error.set('All fields are required');
      return of(false);
    }

    // ── Mock / demo mode ──
    if (this.dataMode.isMock() && (!environment.apiUrl || environment.mockMode)) {
      this._loading.set(false);
      this.router.navigate(['/auth/login']);
      return of(true);
    }
    // ─────────────────────

    this._loading.set(true);
    this._error.set(null);

    const body = {
      email,
      username: username ?? email.split('@')[0],
      full_name: name,
      password,
      role: 'operator',
    };

    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/api/auth/register`, body)
      .pipe(
        tap(() => {
          this._loading.set(false);
          this.router.navigate(['/auth/login']);
        }),
        catchError(err => {
          this._loading.set(false);
          this._error.set(err.error?.detail ?? 'Registration failed');
          return of(false);
        }),
      ) as Observable<boolean>;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/logout (with Bearer token), then clears local state.
   * Navigates to /auth/login regardless of server response.
   */
  logout(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      // Fire-and-forget — clear local state even if server call fails
      this.http
        .post(
          `${this.baseUrl}/api/auth/logout`,
          {},
          { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
        )
        .subscribe({ error: () => { } });
    }
    this._clearSession();
    this.router.navigate(['/auth/login']);
  }

  // ── Token refresh ──────────────────────────────────────────────────────────

  /**
   * POST /api/auth/refresh using stored refresh token.
   * Updates the stored access token signal on success.
   * On failure (expired): clears session and redirects to login.
   */
  refreshToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return of(false);

    return this.http
      .post<{ access_token: string }>(`${this.baseUrl}/api/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        tap(res => {
          localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
          this._token.set(res.access_token);
        }),
        catchError(() => {
          this._clearSession();
          this.router.navigate(['/auth/login']);
          return of(false);
        }),
      ) as Observable<boolean>;
  }

  // ── Clear error ────────────────────────────────────────────────────────────

  clearError(): void {
    this._error.set(null);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Store tokens + user from a successful AuthResponse. */
  private _storeSession(response: AuthResponse, persist: boolean): void {
    const user: AuthUser = {
      id: response.user.id,
      name: response.user.full_name || response.user.username,
      email: response.user.email,
      role: response.user.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(response.user.email)}`,
    };

    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);

    if (persist) {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({ user, token: response.access_token }),
      );
    }

    this._user.set(user);
    this._token.set(response.access_token);
    this._isAuthenticated.set(true);
  }

  /** Clear all auth state and storage. */
  private _clearSession(): void {
    this._isAuthenticated.set(false);
    this._user.set(null);
    this._token.set(null);
    this._mfaPending.set(false);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(MFA_KEY);
  }

  /** Restore auth state from localStorage on app load (page reload). */
  private loadFromStorage(): void {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const raw = localStorage.getItem(USER_STORAGE_KEY);

      if (accessToken && raw) {
        const { user } = JSON.parse(raw) as { user: AuthUser; token: string };
        if (user) {
          this._user.set(user);
          this._token.set(accessToken);
          this._isAuthenticated.set(true);
        }
      }
    } catch {
      console.warn('[AuthService] Failed to restore session from localStorage');
    }
  }
}
