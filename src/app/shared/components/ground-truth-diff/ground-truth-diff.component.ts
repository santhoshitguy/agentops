import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDebuggerService } from '../../../core/services/error-debugger.service';
import { GroundTruthComparison } from '../../../core/models/error-debugger.model';

@Component({
    selector: 'app-ground-truth-diff',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ground-truth-diff.component.html',
    styleUrls: ['./ground-truth-diff.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroundTruthDiffComponent {
    private readonly errorDebuggerService = inject(ErrorDebuggerService);

    // Signal-based input - receives hallucination error ID from parent
    selectedHallucinationId = input.required<string | null>();

    // Computed signal that derives the comparison data
    comparison = computed(() => {
        const id = this.selectedHallucinationId();
        if (!id) return null;
        return this.errorDebuggerService.getGroundTruthComparison(id);
    });

    // Helper for template
    get hasComparison(): boolean {
        return this.comparison() !== null;
    }

    markAsFalsePositive(): void {
        const id = this.selectedHallucinationId();
        if (id) {
            this.errorDebuggerService.markFalsePositive(id, 'current-user');
        }
    }
}
