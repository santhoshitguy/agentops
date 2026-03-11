import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowLeft,
  CheckCircle,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

// ============================================
// MFA (Two-Factor Auth) Component
// 6-digit OTP input with auto-advance focus
// Timer countdown with resend option
// Demo mode: any 6-digit code is accepted
// ============================================

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './mfa.html',
  styleUrl: './mfa.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mfa implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Icons
  shieldIcon = ShieldCheck;
  refreshIcon = RefreshCw;
  zapIcon = Zap;
  arrowLeftIcon = ArrowLeft;
  checkIcon = CheckCircle;

  // OTP state — 6 individual digit signals
  digits = signal<string[]>(['', '', '', '', '', '']);

  // Timer countdown (120 seconds)
  timerSeconds = signal(120);
  timerDisplay = computed(() => {
    const s = this.timerSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });
  canResend = computed(() => this.timerSeconds() <= 0);

  // Verification state
  isLoading = signal(false);
  isVerified = signal(false);
  errorMessage = signal('');

  // Array for @for template iteration
  readonly digitIndices = [0, 1, 2, 3, 4, 5];

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Guard: redirect if MFA wasn't triggered by login/register
    if (!this.auth.mfaPending()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.startTimer();
  }

  ngAfterViewInit(): void {
    // Focus first input after view is ready
    setTimeout(() => {
      this.otpInputs.get(0)?.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ============================================
  // OTP Input Handlers
  // ============================================

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only accept numeric digit, take the last typed character
    const value = input.value.replace(/\D/g, '').slice(-1);
    input.value = value;

    const newDigits = [...this.digits()];
    newDigits[index] = value;
    this.digits.set(newDigits);
    this.errorMessage.set('');

    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = this.otpInputs.get(index + 1);
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }

    // Auto-submit when all 6 digits are filled
    if (newDigits.every(d => d !== '')) {
      this.verifyOtp();
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    // Move backwards on Backspace if current box is empty
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const prevInput = this.otpInputs.get(index - 1);
      if (prevInput) {
        prevInput.nativeElement.focus();
        // Clear previous digit
        const newDigits = [...this.digits()];
        newDigits[index - 1] = '';
        this.digits.set(newDigits);
        event.preventDefault();
      }
    }
    // Block non-numeric except control keys
    if (
      event.key.length === 1 &&
      !/[0-9]/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
    }
  }

  onDigitFocus(index: number, event: FocusEvent): void {
    // Select all text on focus for easy replacement
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '')
      .slice(0, 6);

    const newDigits = Array(6).fill('') as string[];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    this.digits.set(newDigits);

    // Focus the box after the last filled one (or last box)
    const focusIndex = Math.min(pasted.length, 5);
    this.otpInputs.get(focusIndex)?.nativeElement.focus();

    if (pasted.length === 6) {
      this.verifyOtp();
    }
  }

  // ============================================
  // OTP Verification
  // Demo mode: any 6-digit code passes
  // ============================================
  private verifyOtp(): void {
    const code = this.digits().join('');
    if (code.length !== 6) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.completeMfaLogin(code).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isVerified.set(true);
        this.clearTimer();
        // AuthService handles navigation to /dashboard on success
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(this.auth.error() ?? 'Invalid code. Please try again.');
      },
    });
  }

  // ============================================
  // Resend Code
  // ============================================
  resendCode(): void {
    if (!this.canResend()) return;
    this.clearTimer();
    this.digits.set(['', '', '', '', '', '']);
    this.errorMessage.set('');
    this.isLoading.set(false);
    this.startTimer();

    setTimeout(() => {
      this.otpInputs.get(0)?.nativeElement.focus();
    }, 50);
  }

  // ============================================
  // Timer helpers
  // ============================================
  private startTimer(): void {
    this.timerSeconds.set(120);
    this.timerInterval = setInterval(() => {
      this.timerSeconds.update(s => Math.max(0, s - 1));
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getDigitValue(index: number): string {
    return this.digits()[index] ?? '';
  }
}
