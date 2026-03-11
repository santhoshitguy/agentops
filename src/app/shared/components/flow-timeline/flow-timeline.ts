import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    LucideAngularModule,
    Brain,
    Wrench,
    GitBranch,
    Eye,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader,
    RotateCcw,
    Clock,
    Coins,
    ChevronDown,
    ChevronRight,
} from 'lucide-angular';
import { ThoughtStep, ThoughtType, ThoughtStatus } from '../../../core/models/agent.model';

@Component({
    selector: 'app-flow-timeline',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './flow-timeline.html',
    styleUrl: './flow-timeline.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowTimeline {
    @Input() set steps(value: ThoughtStep[]) {
        this.stepsSignal.set(value ?? []);
    }
    @Input() set activeStep(value: number) {
        this.activeStepSignal.set(value);
    }
    @Input() set replayMode(value: boolean) {
        this.replayModeSignal.set(value);
    }
    @Output() stepSelect = new EventEmitter<ThoughtStep>();
    @Output() stepHover = new EventEmitter<number>();

    stepsSignal = signal<ThoughtStep[]>([]);
    activeStepSignal = signal<number>(-1);
    replayModeSignal = signal<boolean>(false);
    expandedSteps = signal<Set<number>>(new Set());

    // Icons
    brainIcon = Brain;
    wrenchIcon = Wrench;
    branchIcon = GitBranch;
    eyeIcon = Eye;
    messageIcon = MessageSquare;
    checkIcon = CheckCircle;
    xIcon = XCircle;
    alertIcon = AlertTriangle;
    loaderIcon = Loader;
    loopIcon = RotateCcw;
    clockIcon = Clock;
    coinsIcon = Coins;
    chevronDownIcon = ChevronDown;
    chevronRightIcon = ChevronRight;

    visibleSteps = computed(() => {
        const steps = this.stepsSignal();
        const active = this.activeStepSignal();
        const replay = this.replayModeSignal();
        if (replay && active >= 0) {
            return steps.filter(s => s.stepNumber <= active);
        }
        return steps;
    });

    getTypeColor(type: ThoughtType): string {
        const map: Record<ThoughtType, string> = {
            reasoning: 'var(--accent-cyan)',
            tool_call: 'var(--accent-green)',
            decision: 'var(--accent-purple)',
            observation: 'var(--accent-orange)',
            final_response: 'var(--accent-lightblue)',
        };
        return map[type];
    }

    getTypeLabel(type: ThoughtType): string {
        const map: Record<ThoughtType, string> = {
            reasoning: 'Reasoning',
            tool_call: 'Tool Call',
            decision: 'Decision',
            observation: 'Observation',
            final_response: 'Response',
        };
        return map[type];
    }

    getTypeIcon(type: ThoughtType) {
        const map = {
            reasoning: Brain,
            tool_call: Wrench,
            decision: GitBranch,
            observation: Eye,
            final_response: MessageSquare,
        };
        return map[type];
    }

    getStatusColor(status: ThoughtStatus): string {
        const map: Record<ThoughtStatus, string> = {
            completed: 'var(--accent-green)',
            failed: 'var(--accent-red)',
            active: 'var(--accent-cyan)',
            pending: 'var(--text-muted)',
            skipped: 'var(--text-disabled)',
        };
        return map[status];
    }

    isActive(step: ThoughtStep): boolean {
        return this.activeStepSignal() === step.stepNumber;
    }

    isExpanded(stepNumber: number): boolean {
        return this.expandedSteps().has(stepNumber);
    }

    toggleExpand(stepNumber: number): void {
        const current = new Set(this.expandedSteps());
        if (current.has(stepNumber)) {
            current.delete(stepNumber);
        } else {
            current.add(stepNumber);
        }
        this.expandedSteps.set(current);
    }

    onStepClick(step: ThoughtStep): void {
        this.toggleExpand(step.stepNumber);
        this.stepSelect.emit(step);
    }

    onStepMouseEnter(stepNumber: number): void {
        this.stepHover.emit(stepNumber);
    }

    onStepMouseLeave(): void {
        this.stepHover.emit(-1);
    }

    formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    }

    truncateText(text: string, max: number): string {
        if (!text) return '';
        return text.length > max ? text.substring(0, max) + '...' : text;
    }
}
