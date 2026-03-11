import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
    ChangeDetectionStrategy,
    OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    LucideAngularModule,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Gauge,
} from 'lucide-angular';

@Component({
    selector: 'app-flow-replay-controls',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './flow-replay-controls.html',
    styleUrl: './flow-replay-controls.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowReplayControls implements OnDestroy {
    @Input() set totalSteps(value: number) {
        this.totalStepsSignal.set(value);
    }
    @Input() set currentStep(value: number) {
        this.currentStepSignal.set(value);
    }
    @Output() stepChange = new EventEmitter<number>();
    @Output() playStateChange = new EventEmitter<boolean>();

    totalStepsSignal = signal(0);
    currentStepSignal = signal(0);
    isPlaying = signal(false);
    playSpeed = signal(1);

    private playInterval: ReturnType<typeof setInterval> | null = null;

    // Icons
    playIcon = Play;
    pauseIcon = Pause;
    skipBackIcon = SkipBack;
    skipForwardIcon = SkipForward;
    resetIcon = RotateCcw;
    prevIcon = ChevronLeft;
    nextIcon = ChevronRight;
    speedIcon = Gauge;

    speeds = [0.5, 1, 2, 4];

    progress = computed(() => {
        const total = this.totalStepsSignal();
        const current = this.currentStepSignal();
        if (total <= 0) return 0;
        return (current / total) * 100;
    });

    togglePlay(): void {
        if (this.isPlaying()) {
            this.pause();
        } else {
            this.play();
        }
    }

    play(): void {
        if (this.currentStepSignal() >= this.totalStepsSignal()) {
            this.currentStepSignal.set(0);
            this.stepChange.emit(0);
        }
        this.isPlaying.set(true);
        this.playStateChange.emit(true);
        this.startAutoPlay();
    }

    pause(): void {
        this.isPlaying.set(false);
        this.playStateChange.emit(false);
        this.stopAutoPlay();
    }

    reset(): void {
        this.pause();
        this.currentStepSignal.set(0);
        this.stepChange.emit(0);
    }

    goToStart(): void {
        this.pause();
        this.currentStepSignal.set(1);
        this.stepChange.emit(1);
    }

    goToEnd(): void {
        this.pause();
        const total = this.totalStepsSignal();
        this.currentStepSignal.set(total);
        this.stepChange.emit(total);
    }

    prevStep(): void {
        const current = this.currentStepSignal();
        if (current > 1) {
            this.currentStepSignal.set(current - 1);
            this.stepChange.emit(current - 1);
        }
    }

    nextStep(): void {
        const current = this.currentStepSignal();
        const total = this.totalStepsSignal();
        if (current < total) {
            this.currentStepSignal.set(current + 1);
            this.stepChange.emit(current + 1);
        } else {
            this.pause();
        }
    }

    cycleSpeed(): void {
        const currentIdx = this.speeds.indexOf(this.playSpeed());
        const nextIdx = (currentIdx + 1) % this.speeds.length;
        this.playSpeed.set(this.speeds[nextIdx]);
        if (this.isPlaying()) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    onProgressClick(event: MouseEvent): void {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const step = Math.round(ratio * this.totalStepsSignal());
        this.currentStepSignal.set(Math.max(1, step));
        this.stepChange.emit(Math.max(1, step));
    }

    private startAutoPlay(): void {
        this.stopAutoPlay();
        const interval = 1200 / this.playSpeed();
        this.playInterval = setInterval(() => {
            this.nextStep();
        }, interval);
    }

    private stopAutoPlay(): void {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    ngOnDestroy(): void {
        this.stopAutoPlay();
    }
}
