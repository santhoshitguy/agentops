import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ChevronRight,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

// ============================================
// Register Component
// Full-screen glassmorphism registration page
// Demo mode: any valid inputs succeed → MFA page
// ============================================

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Icons
  userIcon = User;
  mailIcon = Mail;
  lockIcon = Lock;
  eyeIcon = Eye;
  eyeOffIcon = EyeOff;
  zapIcon = Zap;
  chevronIcon = ChevronRight;

  // Form state
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  acceptTerms = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  // Computed validation
  passwordsMatch = computed(() =>
    !this.confirmPassword() || this.password() === this.confirmPassword()
  );

  passwordStrength = computed(() => {
    const p = this.password();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 0) return '';
    if (s === 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  strengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'var(--accent-error)';
    if (s === 2) return 'var(--accent-warning)';
    if (s === 3) return 'var(--accent-primary)';
    return 'var(--accent-success)';
  });

  // Input handlers
  setName(value: string): void { this.name.set(value); }
  setEmail(value: string): void { this.email.set(value); }
  setPassword(value: string): void { this.password.set(value); }
  setConfirmPassword(value: string): void { this.confirmPassword.set(value); }
  setAcceptTerms(value: boolean): void { this.acceptTerms.set(value); }
  toggleShowPassword(): void { this.showPassword.update(v => !v); }
  toggleShowConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.name().trim() || !this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    if (!this.acceptTerms()) {
      this.errorMessage.set('You must accept the Terms of Service to continue.');
      return;
    }

    this.isLoading.set(true);

    this.auth.register(this.name(), this.email(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        // AuthService navigates to /auth/login on success
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(this.auth.error() ?? 'Registration failed. Please try again.');
      },
    });
  }
}
