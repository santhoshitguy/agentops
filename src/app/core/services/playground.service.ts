/**
 * playground.service.ts — Signal-based state for the LLM Playground.
 *
 * Streaming execution path:
 *   LlmStreamService.stream() → fetch POST /api/playground/stream
 *     → mock server (port 3001) in mock mode
 *     → FastAPI backend (port 3000) in live mode, which proxies to real providers
 *
 * Each selected model streams independently in parallel.
 * cancelAllStreams() aborts all active fetch connections.
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import {
  PlaygroundSession,
  PlaygroundPrompt,
  PlaygroundResponse,
  ModelComparison,
  ModelId,
  ModelParameters,
  CostEstimate,
  TotalCostEstimate,
  AVAILABLE_MODELS,
  DEFAULT_PARAMETERS,
  ComparisonResult,
  StreamRequest,
  StreamEvent,
} from '../models/playground.model';
import { LlmStreamService } from './llm-stream.service';

@Injectable({ providedIn: 'root' })
export class PlaygroundService {
  private readonly llmStream = inject(LlmStreamService);

  // ── State Signals ──────────────────────────────────────────────────────────
  private readonly _session = signal<PlaygroundSession>(this.createNewSession());
  private readonly _streamingText = signal<Map<ModelId, string>>(new Map());
  private readonly _responses = signal<PlaygroundResponse[]>([]);
  private readonly _isExecuting = signal(false);
  private readonly _systemPrompt = signal<string>('');

  // Public readonly signals
  readonly session       = this._session.asReadonly();
  readonly streamingText = this._streamingText.asReadonly();
  readonly responses     = this._responses.asReadonly();
  readonly isExecuting   = this._isExecuting.asReadonly();
  readonly systemPrompt  = this._systemPrompt.asReadonly();

  // ── Computed Signals ───────────────────────────────────────────────────────

  readonly costEstimate = computed((): TotalCostEstimate => {
    const session = this._session();
    const prompt  = session.prompt;
    const models  = session.selectedModels;

    const estimatedInputTokens  = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = session.parameters.maxTokens;

    const estimates: CostEstimate[] = models.map(modelId => {
      const model = AVAILABLE_MODELS[modelId];
      const inputCost  = (estimatedInputTokens / 1000)  * model.inputCostPer1kTokens;
      const outputCost = (estimatedOutputTokens / 1000) * model.outputCostPer1kTokens;
      return {
        modelId,
        estimatedInputTokens,
        estimatedOutputTokens,
        inputCost,
        outputCost,
        totalCost:  inputCost + outputCost,
        confidence: prompt.length > 100 ? 'high' : 'medium',
      };
    });

    const costs     = estimates.map(e => e.totalCost);
    const totalCost = costs.reduce((s, c) => s + c, 0);

    return {
      models,
      estimates,
      totalCost,
      minCost: costs.length ? Math.min(...costs) : 0,
      maxCost: costs.length ? Math.max(...costs) : 0,
    };
  });

  readonly modelComparison = computed((): ModelComparison | null => {
    const responses = this._responses();
    if (responses.length === 0) return null;

    const completed = responses.filter(r => !r.isStreaming);
    if (completed.length === 0) return null;

    const byLatency = [...completed].sort((a, b) => a.latency - b.latency);
    const byCost    = [...completed].sort((a, b) => a.cost    - b.cost);
    const byQuality = [...completed].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));

    const results: ComparisonResult[] = completed.map(r => ({
      modelId:         r.modelId,
      response:        r,
      latencyRank:     byLatency.findIndex(x => x.modelId === r.modelId) + 1,
      costRank:        byCost   .findIndex(x => x.modelId === r.modelId) + 1,
      qualityRank:     byQuality.findIndex(x => x.modelId === r.modelId) + 1,
      costVsFastest:   byCost.length
        ? ((r.cost - byCost[0].cost) / Math.max(0.0001, byCost[0].cost)) * 100 : 0,
      latencyVsSlowest: byLatency.length
        ? ((byLatency[byLatency.length - 1].latency - r.latency) /
            Math.max(1, byLatency[byLatency.length - 1].latency)) * 100 : 0,
    }));

    return {
      promptId:           responses[0].promptId,
      timestamp:          new Date(),
      models:             responses.map(r => r.modelId),
      totalCost:          completed.reduce((s, r) => s + r.cost, 0),
      avgLatency:         completed.reduce((s, r) => s + r.latency, 0) / completed.length,
      avgQualityScore:    completed.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / completed.length,
      fastestModel:       byLatency[0].modelId,
      cheapestModel:      byCost[0].modelId,
      highestQualityModel:byQuality[0].modelId,
      bestValueModel:     this.calculateBestValue(completed),
      results,
    };
  });

  // ── Public Methods ─────────────────────────────────────────────────────────

  updatePrompt(prompt: string): void {
    this._session.update(s => ({ ...s, prompt, updatedAt: new Date() }));
  }

  updateSystemPrompt(systemPrompt: string): void {
    this._systemPrompt.set(systemPrompt);
  }

  updateParameters(parameters: Partial<ModelParameters>): void {
    this._session.update(s => ({
      ...s,
      parameters: { ...s.parameters, ...parameters },
      updatedAt: new Date(),
    }));
  }

  toggleModel(modelId: ModelId): void {
    this._session.update(s => {
      const selected = s.selectedModels.includes(modelId)
        ? s.selectedModels.filter(id => id !== modelId)
        : [...s.selectedModels, modelId];
      return { ...s, selectedModels: selected, updatedAt: new Date() };
    });
  }

  /**
   * Run comparison across all selected models in parallel using real SSE streaming.
   */
  async executeComparison(): Promise<void> {
    const session = this._session();
    if (session.selectedModels.length === 0) {
      console.warn('[Playground] No models selected');
      return;
    }

    this._isExecuting.set(true);
    this._responses.set([]);
    this._streamingText.set(new Map());

    const promptId  = `prompt-${Date.now()}`;
    const startTime = new Date();

    // Fire all model streams in parallel
    const promises = session.selectedModels.map(modelId =>
      this.executeModelStream(promptId, modelId, session.prompt, session.parameters, startTime),
    );

    await Promise.all(promises);
    this._isExecuting.set(false);
  }

  cancelAllStreams(): void {
    this.llmStream.cancelAll();
    this._isExecuting.set(false);
  }

  // ── Private streaming helpers ──────────────────────────────────────────────

  private executeModelStream(
    promptId:   string,
    modelId:    ModelId,
    prompt:     string,
    parameters: ModelParameters,
    startTime:  Date,
  ): Promise<void> {
    return new Promise<void>(resolve => {
      const model    = AVAILABLE_MODELS[modelId];
      const streamId = `${promptId}-${modelId}`;

      // Estimate tokens for cost meter while streaming
      const inputTokens    = Math.ceil(prompt.length / 4);
      const estOutputTokens = parameters.maxTokens;
      const estCost =
        (inputTokens / 1000) * model.inputCostPer1kTokens +
        (estOutputTokens / 1000) * model.outputCostPer1kTokens;

      // Add placeholder response (streaming = true)
      const response: PlaygroundResponse = {
        id:           `response-${Date.now()}-${modelId}`,
        promptId,
        modelId,
        content:      '',
        isStreaming:  true,
        streamProgress: 0,
        tokensUsed:   { input: inputTokens, output: 0, total: inputTokens },
        latency:      0,
        cost:         estCost,
        qualityScore: undefined,
        startTime,
        finishReason: 'stop',
      };
      this._responses.update(r => [...r, response]);

      const req: StreamRequest = {
        streamId,
        modelId,
        prompt,
        systemPrompt: this._systemPrompt(),
        parameters,
      };

      let wordCount = 0;

      this.llmStream.stream(req).subscribe({
        next: (chunk: StreamEvent) => {
          if (chunk.done) {
            // Final metrics from server
            const finalTokens = chunk.tokensUsed ?? { input: inputTokens, output: wordCount, total: inputTokens + wordCount };
            const finalCost   = chunk.cost ?? estCost;
            const finalLatency = chunk.latency ?? (Date.now() - startTime.getTime());

            this._responses.update(responses =>
              responses.map(r =>
                r.modelId === modelId && r.promptId === promptId
                  ? {
                      ...r,
                      isStreaming:    false,
                      streamProgress: 100,
                      endTime:        new Date(),
                      tokensUsed:     finalTokens,
                      cost:           finalCost,
                      latency:        finalLatency,
                      qualityScore:   this.estimateQuality(r.content),
                      finishReason:   chunk.finishReason ?? 'stop',
                    }
                  : r,
              ),
            );

            resolve();
            return;
          }

          if (chunk.delta) {
            wordCount++;

            // Accumulate streaming text
            this._streamingText.update(map => {
              const newMap = new Map(map);
              const current = newMap.get(modelId) ?? '';
              newMap.set(modelId, current + chunk.delta);
              return newMap;
            });

            const accumulated = this._streamingText().get(modelId) ?? '';

            // Update response content + progress (estimate based on word count vs maxTokens)
            const progress = Math.min(99, (wordCount / (parameters.maxTokens / 4)) * 100);
            this._responses.update(responses =>
              responses.map(r =>
                r.modelId === modelId && r.promptId === promptId
                  ? { ...r, content: accumulated, streamProgress: progress }
                  : r,
              ),
            );
          }
        },
        error: (err: Error) => {
          console.error(`[Playground] Stream error for ${modelId}:`, err.message);
          this._responses.update(responses =>
            responses.map(r =>
              r.modelId === modelId && r.promptId === promptId
                ? { ...r, isStreaming: false, error: err.message, finishReason: 'error' }
                : r,
            ),
          );
          resolve();
        },
        complete: () => resolve(),
      });
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private createNewSession(): PlaygroundSession {
    return {
      id:              `session-${Date.now()}`,
      createdAt:       new Date(),
      updatedAt:       new Date(),
      prompt:          '',
      parameters:      { ...DEFAULT_PARAMETERS },
      selectedModels:  ['gpt-4', 'claude-3-sonnet'],
      promptHistory:   [],
      autoSave:        true,
    };
  }

  /**
   * Rough quality heuristic: reward length, markdown structure, numbered lists.
   * Returns a score 0-10.
   */
  private estimateQuality(text: string): number {
    let score = 6;
    if (text.length > 300) score += 1;
    if (text.length > 600) score += 1;
    if (/\d+\./.test(text)) score += 0.5;          // numbered list
    if (/\*\*|__/.test(text)) score += 0.5;         // bold markdown
    if (/\n/.test(text)) score += 0.5;              // multi-line
    if (text.toLowerCase().includes('however') ||
        text.toLowerCase().includes('therefore')) score += 0.5;
    return Math.min(10, score);
  }

  private calculateBestValue(responses: PlaygroundResponse[]): ModelId {
    let best      = responses[0];
    let bestValue = (best.qualityScore ?? 0) / Math.max(0.0001, best.cost);
    responses.forEach(r => {
      const value = (r.qualityScore ?? 0) / Math.max(0.0001, r.cost);
      if (value > bestValue) { bestValue = value; best = r; }
    });
    return best.modelId;
  }
}
