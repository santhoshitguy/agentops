import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SLACompliance } from '../../../core/models/outcome-metrics.model';

@Component({
    selector: 'app-sla-indicator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sla-indicator.component.html',
    styleUrls: ['./sla-indicator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlaIndicatorComponent {
    // Signal inputs
    compliance = input.required<SLACompliance>();

    // Expose Math for template
    readonly Math = Math;

    /**
     * Get color based on SLA compliance percentage
     * Green > 95%, Yellow 85-95%, Red < 85%
     */
    getStatusColor(compliance: SLACompliance): string {
        switch (compliance.status) {
            case 'healthy': return 'var(--color-neon-green)';
            case 'warning': return 'var(--color-neon-yellow)';
            case 'critical': return 'var(--color-neon-red)';
            default: return 'var(--color-gray-500)';
        }
    }

    /**
     * Get icon for status
     */
    getStatusIcon(status: string): string {
        switch (status) {
            case 'healthy': return '✓';
            case 'warning': return '⚠';
            case 'critical': return '✗';
            default: return '○';
        }
    }

    /**
     * Get trend icon
     */
    getTrendIcon(trend: string): string {
        switch (trend) {
            case 'improving': return '↗';
            case 'degrading': return '↘';
            case 'stable': return '→';
            default: return '—';
        }
    }

    /**
     * Format value based on metric type
     */
    formatValue(value: number, unit: string): string {
        if (unit === 'ms') {
            return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
        }
        if (unit === '%') {
            return `${value.toFixed(1)}%`;
        }
        if (unit === 'score') {
            return value.toFixed(2);
        }
        return `${value.toFixed(2)} ${unit}`;
    }
}
