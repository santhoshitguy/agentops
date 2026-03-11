import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ChevronRight,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

// ============================================
// Login Component
// Full-screen glassmorphism auth page
// Demo mode: pre-filled credentials, any input succeeds
// ============================================

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  mailIcon = Mail;
  lockIcon = Lock;
  eyeIcon = Eye;
  eyeOffIcon = EyeOff;
  zapIcon = Zap;
  chevronIcon = ChevronRight;

  // Form state
  email = signal('demo@agentops.ai');
  password = signal('demo123');
  remember = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  // Input handlers (methods, not arrow functions — required for AOT)
  setEmail(value: string): void {
    this.email.set(value);
  }

  setPassword(value: string): void {
    this.password.set(value);
  }

  setRemember(value: boolean): void {
    this.remember.set(value);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    this.errorMessage.set('');
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }
    this.isLoading.set(true);

    this.auth.login(this.email(), this.password(), this.remember()).subscribe({
      next: () => {
        this.isLoading.set(false);
        // AuthService handles navigation:
        //   requires_mfa → stays here with mfaPending=true, route guard sends to /auth/mfa
        //   success      → navigates to /dashboard-v1
        if (this.auth.mfaPending()) {
          this.router.navigate(['/auth/mfa']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(this.auth.error() ?? 'Invalid credentials. Please try again.');
      },
    });
  }
}
