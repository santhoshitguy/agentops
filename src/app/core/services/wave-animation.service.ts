import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';

// ============================================
// Wave Animation Service
// 60fps Canvas Animations with Particle Effects
// ============================================

export interface WaveParticle {
    x: number;
    y: number;
    progress: number;
    speed: number;
    size: number;
    opacity: number;
    color: string;
    pathIndex: number;
}

export interface WavePath {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    controlPoint1: { x: number; y: number };
    controlPoint2: { x: number; y: number };
    color: string;
    glowColor: string;
    active: boolean;
    particles: WaveParticle[];
}

export interface WaveConfig {
    particleCount: number;
    particleSpeed: number;
    particleSize: number;
    lineWidth: number;
    glowIntensity: number;
    waveAmplitude: number;
    waveFrequency: number;
}

@Injectable({
    providedIn: 'root'
})
export class WaveAnimationService {
    private destroyRef = inject(DestroyRef);

    // Signals for reactive state
    private pathsSignal = signal<WavePath[]>([]);
    private configSignal = signal<WaveConfig>({
        particleCount: 8,
        particleSpeed: 0.008,
        particleSize: 3,
        lineWidth: 2,
        glowIntensity: 15,
        waveAmplitude: 30,
        waveFrequency: 0.02
    });
    private isRunningSignal = signal(false);

    // Public computed values
    readonly paths = computed(() => this.pathsSignal());
    readonly config = computed(() => this.configSignal());
    readonly isRunning = computed(() => this.isRunningSignal());

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private animationFrameId: number | null = null;
    private lastTimestamp = 0;

    // Color palette for waves
    private colors = {
        cyan: { main: '#00d4ff', glow: 'rgba(0, 212, 255, 0.4)' },
        purple: { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
        pink: { main: '#f472b6', glow: 'rgba(244, 114, 182, 0.4)' },
        green: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
        orange: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }
    };

    constructor() {
        this.destroyRef.onDestroy(() => this.stop());
    }

    /**
     * Initialize the canvas for wave animations
     */
    initialize(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set up high DPI rendering
        this.setupHighDPI();

        // Handle resize
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.handleResize());
        }
    }

    /**
     * Set up high DPI canvas rendering
     */
    private setupHighDPI(): void {
        if (!this.canvas || !this.ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }

    /**
     * Handle canvas resize
     */
    private handleResize(): void {
        this.setupHighDPI();
    }

    /**
     * Add a wave path between two points
     */
    addPath(
        id: string,
        from: { x: number; y: number },
        to: { x: number; y: number },
        colorKey: keyof typeof this.colors = 'cyan'
    ): void {
        const color = this.colors[colorKey];

        // Calculate bezier control points for smooth curve
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const amplitude = this.configSignal().waveAmplitude;

        // Perpendicular offset for control points
        const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * amplitude;
        const perpY = dx / Math.sqrt(dx * dx + dy * dy) * amplitude;

        const path: WavePath = {
            id,
            from,
            to,
            controlPoint1: {
                x: from.x + dx * 0.25 + perpX,
                y: from.y + dy * 0.25 + perpY
            },
            controlPoint2: {
                x: from.x + dx * 0.75 - perpX,
                y: from.y + dy * 0.75 - perpY
            },
            color: color.main,
            glowColor: color.glow,
            active: true,
            particles: this.createParticles(colorKey)
        };

        this.pathsSignal.update(paths => [...paths, path]);
    }

    /**
     * Create particles for a path
     */
    private createParticles(colorKey: keyof typeof this.colors): WaveParticle[] {
        const config = this.configSignal();
        const color = this.colors[colorKey];
        const particles: WaveParticle[] = [];

        for (let i = 0; i < config.particleCount; i++) {
            particles.push({
                x: 0,
                y: 0,
                progress: i / config.particleCount,
                speed: config.particleSpeed * (0.8 + Math.random() * 0.4),
                size: config.particleSize * (0.5 + Math.random() * 0.5),
                opacity: 0.6 + Math.random() * 0.4,
                color: color.main,
                pathIndex: 0
            });
        }

        return particles;
    }

    /**
     * Remove a path by ID
     */
    removePath(id: string): void {
        this.pathsSignal.update(paths => paths.filter(p => p.id !== id));
    }

    /**
     * Clear all paths
     */
    clearPaths(): void {
        this.pathsSignal.set([]);
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<WaveConfig>): void {
        this.configSignal.update(c => ({ ...c, ...config }));
    }

    /**
     * Start the animation loop
     */
    start(): void {
        if (this.isRunningSignal()) return;

        this.isRunningSignal.set(true);
        this.lastTimestamp = performance.now();
        this.animate();
    }

    /**
     * Stop the animation loop
     */
    stop(): void {
        this.isRunningSignal.set(false);
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main animation loop
     */
    private animate = (): void => {
        if (!this.isRunningSignal()) return;

        const timestamp = performance.now();
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.render();

        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    /**
     * Update particle positions
     */
    private update(deltaTime: number): void {
        this.pathsSignal.update(paths =>
            paths.map(path => {
                if (!path.active) return path;

                const updatedParticles = path.particles.map(particle => {
                    let newProgress = particle.progress + particle.speed;
                    if (newProgress > 1) newProgress -= 1;

                    const point = this.getPointOnBezier(path, newProgress);

                    return {
                        ...particle,
                        progress: newProgress,
                        x: point.x,
                        y: point.y
                    };
                });

                return { ...path, particles: updatedParticles };
            })
        );
    }

    /**
     * Get a point on the bezier curve
     */
    private getPointOnBezier(path: WavePath, t: number): { x: number; y: number } {
        const { from, to, controlPoint1, controlPoint2 } = path;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: mt3 * from.x + 3 * mt2 * t * controlPoint1.x + 3 * mt * t2 * controlPoint2.x + t3 * to.x,
            y: mt3 * from.y + 3 * mt2 * t * controlPoint1.y + 3 * mt * t2 * controlPoint2.y + t3 * to.y
        };
    }

    /**
     * Render the canvas
     */
    private render(): void {
        if (!this.ctx || !this.canvas) return;

        const { width, height } = this.canvas.getBoundingClientRect();

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        const paths = this.pathsSignal();
        const config = this.configSignal();

        // Draw each path
        paths.forEach(path => {
            if (!path.active) return;

            // Draw the path line with glow
            this.drawPathLine(path, config);

            // Draw particles
            this.drawParticles(path, config);
        });
    }

    /**
     * Draw the bezier path line with glow effect
     */
    private drawPathLine(path: WavePath, config: WaveConfig): void {
        if (!this.ctx) return;

        const { from, to, controlPoint1, controlPoint2, color, glowColor } = path;

        // Draw glow layer
        this.ctx.save();
        this.ctx.strokeStyle = glowColor;
        this.ctx.lineWidth = config.lineWidth + config.glowIntensity;
        this.ctx.lineCap = 'round';
        this.ctx.filter = `blur(${config.glowIntensity / 2}px)`;

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.bezierCurveTo(
            controlPoint1.x, controlPoint1.y,
            controlPoint2.x, controlPoint2.y,
            to.x, to.y
        );
        this.ctx.stroke();
        this.ctx.restore();

        // Draw main line
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = config.lineWidth;
        this.ctx.lineCap = 'round';

        // Add dashed effect
        this.ctx.setLineDash([8, 4]);
        this.ctx.lineDashOffset = -performance.now() / 50; // Animated dash

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.bezierCurveTo(
            controlPoint1.x, controlPoint1.y,
            controlPoint2.x, controlPoint2.y,
            to.x, to.y
        );
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * Draw particles along the path
     */
    private drawParticles(path: WavePath, config: WaveConfig): void {
        if (!this.ctx) return;

        path.particles.forEach(particle => {
            // Draw particle glow
            this.ctx!.save();
            this.ctx!.fillStyle = path.glowColor;
            this.ctx!.filter = `blur(${particle.size * 2}px)`;
            this.ctx!.beginPath();
            this.ctx!.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            this.ctx!.fill();
            this.ctx!.restore();

            // Draw particle core
            this.ctx!.save();
            this.ctx!.fillStyle = particle.color;
            this.ctx!.globalAlpha = particle.opacity;
            this.ctx!.beginPath();
            this.ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx!.fill();

            // Inner bright core
            this.ctx!.fillStyle = '#ffffff';
            this.ctx!.globalAlpha = particle.opacity * 0.8;
            this.ctx!.beginPath();
            this.ctx!.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
            this.ctx!.fill();
            this.ctx!.restore();
        });
    }

    /**
     * Set path active state
     */
    setPathActive(id: string, active: boolean): void {
        this.pathsSignal.update(paths =>
            paths.map(p => (p.id === id ? { ...p, active } : p))
        );
    }

    /**
     * Update path endpoints (for draggable nodes)
     */
    updatePathEndpoints(
        id: string,
        from?: { x: number; y: number },
        to?: { x: number; y: number }
    ): void {
        this.pathsSignal.update(paths =>
            paths.map(path => {
                if (path.id !== id) return path;

                const newFrom = from || path.from;
                const newTo = to || path.to;

                const dx = newTo.x - newFrom.x;
                const dy = newTo.y - newFrom.y;
                const amplitude = this.configSignal().waveAmplitude;

                const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * amplitude;
                const perpY = dx / Math.sqrt(dx * dx + dy * dy) * amplitude;

                return {
                    ...path,
                    from: newFrom,
                    to: newTo,
                    controlPoint1: {
                        x: newFrom.x + dx * 0.25 + perpX,
                        y: newFrom.y + dy * 0.25 + perpY
                    },
                    controlPoint2: {
                        x: newFrom.x + dx * 0.75 - perpX,
                        y: newFrom.y + dy * 0.75 - perpY
                    }
                };
            })
        );
    }
}
