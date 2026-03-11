import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentMessage } from '../../../core/models/agent-communication.model';

@Component({
    selector: 'app-message-timeline',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './message-timeline.component.html',
    styleUrls: ['./message-timeline.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageTimelineComponent {
    // Signal-based input
    messages = input.required<AgentMessage[]>();

    // Icon mapping for message types
    getMessageIcon(messageType: string): string {
        const icons: Record<string, string> = {
            task_delegation: '📋',
            result_response: '✅',
            status_update: '📊',
            data_transfer: '📦',
            error_report: '❌',
            handoff: '🔄'
        };
        return icons[messageType] || '💬';
    }

    // Color mapping for message types
    getMessageColor(messageType: string): string {
        const colors: Record<string, string> = {
            task_delegation: 'var(--color-cyan)',
            result_response: 'var(--color-neon-green)',
            status_update: 'var(--color-neon-purple)',
            data_transfer: 'var(--color-neon-orange)',
            error_report: 'var(--color-neon-red)',
            handoff: 'var(--color-neon-yellow)'
        };
        return colors[messageType] || 'var(--color-gray-400)';
    }

    // Priority badge color
    getPriorityColor(priority: string): string {
        const colors: Record<string, string> = {
            urgent: 'var(--color-neon-red)',
            high: 'var(--color-neon-orange)',
            normal: 'var(--color-cyan)',
            low: 'var(--color-gray-500)'
        };
        return colors[priority] || 'var(--color-gray-400)';
    }

    // Format timestamp as relative time
    getRelativeTime(date: Date): string {
        const now = Date.now();
        const diff = now - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }

    // Format bytes
    formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}
