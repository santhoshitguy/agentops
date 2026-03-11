import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confidence-gauge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confidence-gauge.component.html',
    styleUrls: ['./confidence-gauge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfidenceGaugeComponent {
    // Signal-based inputs
    confidence = input.required<number>(); // 0-1 scale
    label = input<string>('Confidence');
    size = input<number>(120); // Diameter in pixels

    // Computed properties for SVG
    get strokeDasharray(): string {
        const circumference = 2 * Math.PI * 45; // radius = 45
        return `${circumference} ${circumference}`;
    }

    get strokeDashoffset(): number {
        const circumference = 2 * Math.PI * 45;
        const percent = this.confidence();
        return circumference - (percent * circumference);
    }

    get confidencePercent(): number {
        return Math.round(this.confidence() * 100);
    }

    get gaugeColor(): string {
        const conf = this.confidence();
        if (conf >= 0.9) return 'var(--accent-success)';
        if (conf >= 0.75) return 'var(--accent-primary)';
        if (conf >= 0.5) return 'var(--accent-warning)';
        return 'var(--accent-error)';
    }
}
