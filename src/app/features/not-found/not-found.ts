import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found-container">
      <div class="glitch-wrapper">
        <div class="glitch" data-text="404">404</div>
      </div>

      <div class="content">
        <h2 class="title">Page Not Found</h2>
        <p class="subtitle">
          The agent you're looking for has gone offline or this route doesn't exist in the system.
        </p>

        <div class="actions">
          <button class="btn-primary" (click)="goHome()">
            <span class="btn-icon">⬡</span>
            Return to Dashboard
          </button>
          <button class="btn-ghost" (click)="goBack()">
            ← Go Back
          </button>
        </div>
      </div>

      <div class="grid-overlay"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .not-found-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary, #070b14);
      overflow: hidden;
      gap: 1.5rem;
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .orb-1 {
      width: 400px; height: 400px;
      top: -100px; left: -100px;
      background: radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%);
    }
    .orb-2 {
      width: 500px; height: 500px;
      bottom: -150px; right: -150px;
      background: radial-gradient(circle, rgba(179, 136, 255, 0.08) 0%, transparent 70%);
    }

    /* Glitch effect */
    .glitch-wrapper {
      position: relative;
      z-index: 1;
    }
    .glitch {
      font-family: var(--font-mono, 'Fira Code', monospace);
      font-size: clamp(6rem, 20vw, 12rem);
      font-weight: 900;
      color: var(--accent-primary, #00e5ff);
      text-shadow:
        0 0 20px rgba(0, 229, 255, 0.8),
        0 0 60px rgba(0, 229, 255, 0.4),
        0 0 100px rgba(0, 229, 255, 0.2);
      line-height: 1;
      position: relative;
      animation: flicker 4s infinite;
    }
    .glitch::before,
    .glitch::after {
      content: attr(data-text);
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }
    .glitch::before {
      color: var(--accent-error, #ff5252);
      text-shadow: 2px 0 0 rgba(255, 82, 82, 0.7);
      animation: glitch-1 3s infinite;
      clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
    }
    .glitch::after {
      color: var(--accent-primary, #00e5ff);
      text-shadow: -2px 0 0 rgba(0, 229, 255, 0.7);
      animation: glitch-2 3s infinite;
      clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
    }

    @keyframes glitch-1 {
      0%, 90%, 100% { transform: translate(0); opacity: 0; }
      91% { transform: translate(-3px, 1px); opacity: 1; }
      93% { transform: translate(3px, -1px); opacity: 1; }
      95% { transform: translate(-3px); opacity: 1; }
      97% { transform: translate(0); opacity: 0; }
    }
    @keyframes glitch-2 {
      0%, 85%, 100% { transform: translate(0); opacity: 0; }
      86% { transform: translate(3px, -1px); opacity: 1; }
      88% { transform: translate(-3px, 1px); opacity: 1; }
      90% { transform: translate(0); opacity: 0; }
    }
    @keyframes flicker {
      0%, 97%, 100% { opacity: 1; }
      98% { opacity: 0.85; }
      99% { opacity: 1; }
    }

    .content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 520px;
      padding: 0 2rem;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary, #e0f2ff);
      margin: 0 0 0.75rem;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: var(--text-secondary, #8ba5c4);
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: var(--accent-primary, #00e5ff);
      color: #000;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
      box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
    }
    .btn-primary:hover {
      box-shadow: 0 0 32px rgba(0, 229, 255, 0.7);
      transform: translateY(-1px);
    }
    .btn-icon { font-size: 1rem; }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.75rem;
      background: transparent;
      color: var(--text-secondary, #8ba5c4);
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px solid var(--border-primary, rgba(0, 229, 255, 0.15));
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }
    .btn-ghost:hover {
      border-color: var(--accent-primary, #00e5ff);
      color: var(--accent-primary, #00e5ff);
    }

    @media (max-width: 480px) {
      .actions { flex-direction: column; align-items: center; }
      .btn-primary, .btn-ghost { width: 100%; justify-content: center; }
    }
  `],
})
export class NotFound {
  constructor(private readonly router: Router) {}

  goHome(): void {
    this.router.navigate(['/dashboard-v1']);
  }

  goBack(): void {
    window.history.back();
  }
}
