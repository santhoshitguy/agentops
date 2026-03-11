/**
 * api.service.ts — Shared HTTP wrapper for all AgentOps backend REST calls.
 *
 * All Angular services should inject ApiService instead of HttpClient directly.
 * This centralises:
 *   - Base URL (from environment.apiUrl)
 *   - Authorization header injection (Bearer token from AuthService)
 *   - Consistent error normalisation
 *
 * Usage:
 *   this.api.get<Agent[]>('/api/agents').subscribe(agents => ...)
 *   this.api.post<AuthResponse>('/api/auth/login', { email, password }).subscribe(...)
 *
 * Circular dependency note:
 *   ApiService reads the token directly from localStorage (same key AuthService uses)
 *   rather than injecting AuthService, to avoid a circular dependency
 *   (AuthService → ApiService → AuthService).
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { DataModeService } from './data-mode.service';

// ── Error shape returned to callers ──────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

// ── Token storage key (must match AuthService) ────────────────────────────────
const ACCESS_TOKEN_KEY = 'agentops-access-token';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http     = inject(HttpClient);
  private dataMode = inject(DataModeService);

  /** Returns mock server URL when DataModeService = 'mock', real backend otherwise. */
  private get baseUrl(): string {
    return this.dataMode.isMock() && environment.mockServerUrl
      ? environment.mockServerUrl
      : environment.apiUrl;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /** Build headers with optional Bearer token. */
  private headers(): HttpHeaders {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Normalise HttpErrorResponse into a typed ApiError and re-throw. */
  private handleError(err: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      status: err.status,
      message: err.error?.detail ?? err.error?.message ?? err.message ?? 'An error occurred',
      detail: err.error,
    };
    return throwError(() => apiError);
  }

  // ── Public HTTP methods ─────────────────────────────────────────────────────

  /** GET /path?params */
  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { headers: this.headers(), params: httpParams })
      .pipe(catchError(e => this.handleError(e)));
  }

  /** POST /path with JSON body */
  post<T>(path: string, body: object = {}): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  /** PUT /path with JSON body */
  put<T>(path: string, body: object = {}): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  /** PATCH /path with optional JSON body */
  patch<T>(path: string, body: object = {}): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  /** DELETE /path */
  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }
}
