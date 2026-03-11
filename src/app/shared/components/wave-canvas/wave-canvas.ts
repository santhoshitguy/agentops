import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaveAnimationService } from '../../../core/services/wave-animation.service';


// ============================================
// Wave Canvas Component
// Animated Connections Between Nodes
// ============================================

@Component({
  selector: 'app-wave-canvas',
  imports: [],
  templateUrl: './wave-canvas.html',
  styleUrl: './wave-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveCanvas {
  @ViewChild('waveCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() set canvasWidth(value: number) { this.widthSignal.set(value); }
  @Input() set canvasHeight(value: number) { this.heightSignal.set(value); }

  private waveService = inject(WaveAnimationService);

  private widthSignal = signal(800);
  private heightSignal = signal(600);

  width = this.widthSignal.asReadonly();
  height = this.heightSignal.asReadonly();

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.waveService.initialize(canvas);
    this.waveService.start();
  }

  ngOnDestroy(): void {
    this.waveService.stop();
    this.waveService.clearPaths();
  }

  addConnection(
    id: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: 'cyan' | 'purple' | 'pink' | 'green' | 'orange' = 'cyan'
  ): void {
    this.waveService.addPath(id, from, to, color);
  }

  removeConnection(id: string): void {
    this.waveService.removePath(id);
  }

  updateConnection(
    id: string,
    from?: { x: number; y: number },
    to?: { x: number; y: number }
  ): void {
    this.waveService.updatePathEndpoints(id, from, to);
  }
}
