import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpanWaterfallItem } from '../../../core/models/otel.model';

@Component({
    selector: 'app-span-waterfall',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './span-waterfall.component.html',
    styleUrls: ['./span-waterfall.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpanWaterfallComponent {
    // Signal inputs
    waterfallItems = input.required<SpanWaterfallItem[]>();
    traceDuration = input.required<number>(); // Total trace duration in ms

    /**
     * Get color for span based on status and kind
     */
    getSpanColor(item: SpanWaterfallItem): string {
        if (item.span.status.code === 'ERROR') {
            return 'var(--color-neon-red)';
        }

        switch (item.span.kind) {
            case 'SERVER': return 'var(--color-cyan)';
            case 'CLIENT': return 'var(--color-neon-purple)';
            case 'PRODUCER': return 'var(--color-neon-green)';
            case 'CONSUMER': return 'var(--color-neon-yellow)';
            case 'INTERNAL':
            default: return 'var(--color-neon-blue)';
        }
    }

    /**
     * Get icon for span kind
     */
    getKindIcon(kind: string): string {
        switch (kind) {
            case 'SERVER': return '🖥️';
            case 'CLIENT': return '📡';
            case 'PRODUCER': return '📤';
            case 'CONSUMER': return '📥';
            case 'INTERNAL':
            default: return '⚙️';
        }
    }

    /**
     * Get status icon
     */
    getStatusIcon(code: string): string {
        switch (code) {
            case 'OK': return '✓';
            case 'ERROR': return '✗';
            case 'UNSET':
            default: return '○';
        }
    }

    /**
     * Format attributes for tooltip
     */
    formatAttributes(attributes: Record<string, string | number | boolean>): string {
        return Object.entries(attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }
}
