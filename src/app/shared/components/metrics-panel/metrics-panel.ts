import {
  Component,
  Input,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

// ============================================
// Left Metrics Panel Component
// Token Gauge, Cost Tracking, Model Toggles
// ============================================

export interface ModelToggle {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}
@Component({
  selector: 'app-metrics-panel',
  imports: [DecimalPipe],
  templateUrl: './metrics-panel.html',
  styleUrl: './metrics-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPanel {
  @Input() set tokens(value: number) { this.tokensSignal.set(value); }
  @Input() set maxTokens(value: number) { this.maxTokensSignal.set(value); }
  @Input() set cost(value: number) { this.costSignal.set(value); }
  @Input() set context(value: { used: number; total: number }) {
    this.contextUsedSignal.set(value.used);
    this.contextTotalSignal.set(value.total);
  }

  // Signals
  private tokensSignal = signal(1000000);
  private maxTokensSignal = signal(2000000);
  private costSignal = signal(68);
  private contextUsedSignal = signal(120000);
  private contextTotalSignal = signal(200000);
  private budgetEnabledSignal = signal(true);
  private modelsSignal = signal<ModelToggle[]>([
    { id: 'gpt4', name: 'GPT-4 Turbo', enabled: true, color: '#00e676' },
    { id: 'claude', name: 'Claude 3 Opus', enabled: true, color: '#b388ff' },
    { id: 'gemini', name: 'Gemini Pro', enabled: false, color: '#00e5ff' },
    { id: 'llama', name: 'LLaMA 3', enabled: true, color: '#ff9100' }
  ]);

  // Computed
  contextUsed = this.contextUsedSignal.asReadonly();
  contextTotal = this.contextTotalSignal.asReadonly();
  costTotal = this.costSignal.asReadonly();
  budgetEnabled = this.budgetEnabledSignal.asReadonly();
  models = this.modelsSignal.asReadonly();

  // Gauge calculations
  private radius = 85;
  circumference = computed(() => 2 * Math.PI * this.radius);
  dashOffset = computed(() => {
    const progress = this.tokensSignal() / this.maxTokensSignal();
    return this.circumference() * (1 - Math.min(progress, 1));
  });

  formattedTokens = computed(() => {
    const tokens = this.tokensSignal();
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  });

  ticks = computed(() => {
    const count = 60;
    return Array.from({ length: count }, (_, i) => (i * 360) / count);
  });

  tickStart(angle: number): { x: number; y: number } {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: 100 + 75 * Math.cos(rad),
      y: 100 + 75 * Math.sin(rad)
    };
  }

  tickEnd(angle: number): { x: number; y: number } {
    const rad = (angle - 90) * (Math.PI / 180);
    const isMajor = angle % 30 === 0;
    const len = isMajor ? 8 : 4;
    return {
      x: 100 + (75 + len) * Math.cos(rad),
      y: 100 + (75 + len) * Math.sin(rad)
    };
  }

  toggleBudget(): void {
    this.budgetEnabledSignal.update(v => !v);
  }

  toggleModel(id: string): void {
    this.modelsSignal.update(models =>
      models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m)
    );
  }
}
