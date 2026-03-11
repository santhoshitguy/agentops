import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ============================================
// Approval Modal Component
// Human-in-the-loop action approval overlay
// ============================================

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-approval-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './approval-modal.html',
  styleUrl: './approval-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalModal {
  @Input() set visible(v: boolean) { this.visibleSignal.set(v); }
  @Input() set agentName(v: string) { this.agentNameSignal.set(v); }
  @Input() set action(v: string) { this.actionSignal.set(v); }
  @Input() set actionType(v: string) { this.actionTypeSignal.set(v); }
  @Input() set reasoning(v: string) { this.reasoningSignal.set(v); }
  @Input() set riskLevel(v: RiskLevel) { this.riskLevelSignal.set(v); }
  @Input() set proposedInput(v: string) { this.proposedInputSignal.set(v); }

  @Output() approve = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() modify = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  visibleSignal = signal(false);
  agentNameSignal = signal('');
  actionSignal = signal('');
  actionTypeSignal = signal('');
  reasoningSignal = signal('');
  riskLevelSignal = signal<RiskLevel>('low');
  proposedInputSignal = signal('');

  showModifyInput = signal(false);
  modifiedInput = signal('');

  riskColor = computed(() => {
    const colors: Record<RiskLevel, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    };
    return colors[this.riskLevelSignal()];
  });

  riskBgColor = computed(() => {
    const colors: Record<RiskLevel, string> = {
      low: 'rgba(16, 185, 129, 0.1)',
      medium: 'rgba(245, 158, 11, 0.1)',
      high: 'rgba(249, 115, 22, 0.1)',
      critical: 'rgba(239, 68, 68, 0.1)',
    };
    return colors[this.riskLevelSignal()];
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visibleSignal()) {
      this.onClose();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onClose(): void {
    this.showModifyInput.set(false);
    this.modifiedInput.set('');
    this.close.emit();
  }

  onApprove(): void {
    this.approve.emit();
    this.onClose();
  }

  onReject(): void {
    this.reject.emit();
    this.onClose();
  }

  onModifyToggle(): void {
    this.showModifyInput.update(v => !v);
    if (!this.showModifyInput()) {
      this.modifiedInput.set('');
    } else {
      this.modifiedInput.set(this.proposedInputSignal());
    }
  }

  onModifySubmit(): void {
    this.modify.emit(this.modifiedInput());
    this.onClose();
  }
}
