import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalTracker } from '../../../core/models/outcome-metrics.model';

@Component({
    selector: 'app-goal-progress-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './goal-progress-card.component.html',
    styleUrls: ['./goal-progress-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalProgressCardComponent {
    // Signal inputs
    goal = input.required<GoalTracker>();

    /**
     * Get color based on goal status
     */
    getStatusColor(status: string): string {
        switch (status) {
            case 'completed': return 'var(--color-neon-green)';
            case 'in_progress': return 'var(--color-cyan)';
            case 'at_risk': return 'var(--color-neon-yellow)';
            case 'failed': return 'var(--color-neon-red)';
            case 'not_started': return 'var(--color-gray-500)';
            default: return 'var(--color-gray-500)';
        }
    }

    /**
     * Get status icon
     */
    getStatusIcon(status: string): string {
        switch (status) {
            case 'completed': return '✓';
            case 'in_progress': return '⟳';
            case 'at_risk': return '⚠';
            case 'failed': return '✗';
            case 'not_started': return '○';
            default: return '○';
        }
    }

    /**
     * Get priority color
     */
    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'critical': return 'var(--color-neon-red)';
            case 'high': return 'var(--color-neon-orange)';
            case 'medium': return 'var(--color-neon-yellow)';
            case 'low': return 'var(--color-cyan)';
            default: return 'var(--color-gray-500)';
        }
    }

    /**
     * Calculate days remaining
     */
    getDaysRemaining(targetDate: Date): number {
        const now = new Date();
        const remaining = targetDate.getTime() - now.getTime();
        return Math.ceil(remaining / (1000 * 60 * 60 * 24));
    }

    /**
     * Format value based on unit
     */
    formatValue(value: number, unit: string): string {
        if (unit === 'ms') {
            return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
        }
        if (unit === '%') {
            return `${value.toFixed(1)}%`;
        }
        return `${value.toFixed(1)} ${unit}`;
    }
}
