import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import type { Color } from '@swimlane/ngx-charts';
import { CommunicationMatrix } from '../../../core/models/agent-communication.model';

@Component({
    selector: 'app-communication-matrix',
    standalone: true,
    imports: [CommonModule, NgxChartsModule],
    templateUrl: './communication-matrix.component.html',
    styleUrls: ['./communication-matrix.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunicationMatrixComponent {
    // Signal-based input
    matrixData = input.required<CommunicationMatrix[]>();

    // Chart configuration
    colorScheme: Color = {
        name: 'agentops-matrix',
        selectable: false,
        group: ScaleType.Ordinal,
        domain: ['#1a1a2e', '#16213e', '#0f3460', '#00e5ff', '#00c8ff', '#00a8e0']
    };

    // Transform data for heatmap
    get heatmapData(): { name: string; series: { name: string; value: number }[] }[] {
        const data = this.matrixData();

        // Get unique agent IDs
        const agentIds = new Set<string>();
        data.forEach(item => {
            agentIds.add(item.fromAgentId);
            agentIds.add(item.toAgentId);
        });

        const agents = Array.from(agentIds);

        // Build series for each "from" agent
        return agents.map(fromAgent => ({
            name: fromAgent,
            series: agents.map(toAgent => {
                const cell = data.find(d => d.fromAgentId === fromAgent && d.toAgentId === toAgent);
                return {
                    name: toAgent,
                    value: cell?.messageCount || 0
                };
            })
        }));
    }

    // Cell tooltip
    formatTooltip(data: { series: string; name: string; value: number }): string {
        return `${data.series} → ${data.name}: ${data.value} messages`;
    }
}
