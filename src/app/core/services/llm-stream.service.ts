/**
 * llm-stream.service.ts
 *
 * Wraps `fetch()` + `ReadableStream` into an RxJS Observable so that
 * Angular components can subscribe to SSE token chunks using standard
 * reactive patterns (subscribe, takeUntil, async pipe, etc.).
 *
 * Supports POST requests and Authorization headers — two things the
 * native `EventSource` API cannot do.
 *
 * Routes:
 *   Mock mode → POST {mockServerUrl}/api/playground/stream
 *   Live mode → POST {apiUrl}/api/playground/stream
 *
 * Usage:
 *   this.llmStream.stream(req).subscribe({
 *     next:     chunk => accumulate(chunk.delta),
 *     error:    err   => handleError(err),
 *     complete: ()    => finalise(),
 *   });
 *
 *   this.llmStream.cancel(streamId);   // abort a running stream
 *   this.llmStream.cancelAll();        // abort all active streams
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DataModeService } from './data-mode.service';
import { StreamRequest, StreamEvent } from '../models/playground.model';

const ACCESS_TOKEN_KEY = 'agentops-access-token';

@Injectable({ providedIn: 'root' })
export class LlmStreamService {
  private dataMode = inject(DataModeService);

  /** Active AbortControllers — keyed by streamId */
  private readonly controllers = new Map<string, AbortController>();

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start a streaming completion.
   *
   * The Observable emits `StreamEvent` objects as tokens arrive.
   * The final event has `done: true` and carries `tokensUsed`, `cost`, `latency`.
   * Completing (or unsubscribing) aborts the fetch automatically.
   */
  stream(req: StreamRequest): Observable<StreamEvent> {
    return new Observable<StreamEvent>(observer => {
      const controller = new AbortController();
      this.controllers.set(req.streamId, controller);

      const baseUrl = this.dataMode.isMock() && environment.mockServerUrl
        ? environment.mockServerUrl
        : environment.apiUrl;

      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      fetch(`${baseUrl}/api/playground/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model:         req.modelId,
          prompt:        req.prompt,
          system_prompt: req.systemPrompt ?? '',
          temperature:   req.parameters.temperature,
          max_tokens:    req.parameters.maxTokens,
          top_p:         req.parameters.topP,
        }),
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`SSE request failed: HTTP ${res.status} ${res.statusText}`);
          }
          return res.body!.getReader();
        })
        .then(reader => {
          const decoder = new TextDecoder();
          let buffer = '';

          const read = (): Promise<void> =>
            reader.read().then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }

              buffer += decoder.decode(value, { stream: true });

              // SSE events are separated by double newline
              const events = buffer.split('\n\n');
              buffer = events.pop() ?? '';   // keep trailing partial event

              for (const eventBlock of events) {
                for (const line of eventBlock.split('\n')) {
                  if (line.startsWith('data: ')) {
                    try {
                      const chunk = JSON.parse(line.slice(6)) as StreamEvent;
                      observer.next(chunk);
                      if (chunk.done) {
                        observer.complete();
                        return;
                      }
                    } catch {
                      // skip malformed JSON — server may send comments or empty lines
                    }
                  }
                }
              }

              return read();
            });

          return read();
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') {
            // cancelled by caller — complete cleanly (not an error)
            observer.complete();
          } else {
            observer.error(err);
          }
        })
        .finally(() => {
          this.controllers.delete(req.streamId);
        });

      // Teardown: abort fetch when Observable is unsubscribed
      return () => {
        controller.abort();
        this.controllers.delete(req.streamId);
      };
    });
  }

  /** Abort a single active stream by ID. */
  cancel(streamId: string): void {
    this.controllers.get(streamId)?.abort();
    this.controllers.delete(streamId);
  }

  /** Abort all active streams (e.g. on page navigation or component destroy). */
  cancelAll(): void {
    this.controllers.forEach(c => c.abort());
    this.controllers.clear();
  }
}
