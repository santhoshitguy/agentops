import { Injectable, signal, computed, OnDestroy, NgZone, inject } from '@angular/core';
import { Subject, Observable, timer, retry, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

// ============================================
// WebSocket Event Types
// ============================================
export interface WsEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  mockMode?: boolean;
  mockInterval?: number;
}

// ============================================
// Mock Event Generators
// ============================================
type MockEventGenerator = () => WsEvent;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private ngZone = inject(NgZone);

  // Connection state
  private _connectionStatus = signal<ConnectionStatus>('disconnected');
  private _reconnectAttempts = signal(0);
  private _lastEventTime = signal<number>(0);

  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly reconnectAttempts = this._reconnectAttempts.asReadonly();
  readonly lastEventTime = this._lastEventTime.asReadonly();
  readonly isConnected = computed(() => this._connectionStatus() === 'connected');

  // Event streams
  private eventSubject = new Subject<WsEvent>();
  private socket$: WebSocketSubject<WsEvent> | null = null;
  private mockIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private mockGenerators: Map<string, MockEventGenerator> = new Map();

  // Config
  private config: WebSocketConfig = {
    url: '',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    mockMode: true,
    mockInterval: 2000,
  };

  // ============================================
  // Public API
  // ============================================

  /**
   * Connect to a WebSocket server or start mock mode
   */
  connect(config: Partial<WebSocketConfig> = {}): void {
    this.config = { ...this.config, ...config };

    if (this.config.mockMode) {
      this.startMockMode();
    } else {
      this.connectWebSocket();
    }
  }

  /**
   * Disconnect from WebSocket and clean up
   */
  disconnect(): void {
    this.cleanup();
    this._connectionStatus.set('disconnected');
    this._reconnectAttempts.set(0);
  }

  /**
   * Subscribe to events of a specific type
   */
  on<T = unknown>(eventName: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const sub = this.eventSubject.subscribe(wsEvent => {
        if (wsEvent.event === eventName) {
          subscriber.next(wsEvent.data as T);
        }
      });
      return () => sub.unsubscribe();
    });
  }

  /**
   * Subscribe to all events
   */
  onAll(): Observable<WsEvent> {
    return this.eventSubject.asObservable();
  }

  /**
   * Send a message to the WebSocket server
   */
  send<T = unknown>(event: string, data: T): void {
    if (this.config.mockMode) {
      // In mock mode, echo back as if server responded
      return;
    }

    if (this.socket$ && this._connectionStatus() === 'connected') {
      this.socket$.next({ event, data, timestamp: Date.now() });
    }
  }

  /**
   * Register a mock event generator for a specific event type
   */
  registerMockGenerator(eventName: string, generator: MockEventGenerator): void {
    this.mockGenerators.set(eventName, generator);
  }

  /**
   * Emit a mock event manually (useful for feature components)
   */
  emitMockEvent<T = unknown>(event: string, data: T): void {
    this.eventSubject.next({ event, data, timestamp: Date.now() });
    this._lastEventTime.set(Date.now());
  }

  // ============================================
  // WebSocket Connection
  // ============================================

  private connectWebSocket(): void {
    this._connectionStatus.set('connecting');

    try {
      this.socket$ = webSocket<WsEvent>({
        url: this.config.url,
        openObserver: {
          next: () => {
            this.ngZone.run(() => {
              this._connectionStatus.set('connected');
              this._reconnectAttempts.set(0);
            });
          },
        },
        closeObserver: {
          next: () => {
            this.ngZone.run(() => {
              this._connectionStatus.set('disconnected');
              this.attemptReconnect();
            });
          },
        },
      });

      this.socket$.subscribe({
        next: (event) => {
          this.ngZone.run(() => {
            this.eventSubject.next(event);
            this._lastEventTime.set(Date.now());
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this._connectionStatus.set('error');
            console.error('[WebSocketService] Error:', err);
            this.attemptReconnect();
          });
        },
      });
    } catch (err) {
      this._connectionStatus.set('error');
      console.error('[WebSocketService] Connection failed:', err);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    const attempts = this._reconnectAttempts();
    if (attempts >= (this.config.maxReconnectAttempts ?? 10)) {
      console.warn('[WebSocketService] Max reconnect attempts reached');
      this._connectionStatus.set('error');
      return;
    }

    const backoff = Math.min(
      (this.config.reconnectInterval ?? 3000) * Math.pow(2, attempts),
      30000
    );

    this.reconnectTimeoutId = setTimeout(() => {
      this._reconnectAttempts.update(a => a + 1);
      this.connectWebSocket();
    }, backoff);
  }

  // ============================================
  // Mock Mode
  // ============================================

  private startMockMode(): void {
    this._connectionStatus.set('connected');
    this._reconnectAttempts.set(0);

    const interval = this.config.mockInterval ?? 2000;

    let tickCount = 0;
    this.mockIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        tickCount++;
        this.mockGenerators.forEach((generator, eventName) => {
          try {
            const event = generator();
            this.eventSubject.next(event);
            this._lastEventTime.set(Date.now());

            // Only log meaningful events — skip heartbeat / noop noise
            if (event.event !== 'heartbeat' && event.event !== 'noop') {
            }
          } catch (err) {
            console.warn(`[WS] Mock generator error for ${eventName}:`, err);
          }
        });
      });
    }, interval);
  }

  // ============================================
  // Cleanup
  // ============================================

  private cleanup(): void {
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    this.mockGenerators.clear();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventSubject.complete();
  }
}
