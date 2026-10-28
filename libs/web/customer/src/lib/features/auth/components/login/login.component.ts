// Core
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// RxJS
import { firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Translate
// Services
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils, StorageService } from '@cthub-bsaas/web-core-platform';
import { LoginService } from './login.service';
import type { CustomerAuthUser } from '../../models/auth.models';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent extends AbstractBaseComponent implements OnInit, OnDestroy {
  protected platformUtils = inject<PlatformUtils>(PLATFORM_UTILS_TOKEN);
  private fb = inject<FormBuilder>(FormBuilder);
  private router = inject<Router>(Router);
  private route = inject<ActivatedRoute>(ActivatedRoute);
  private storageService = inject<StorageService>(StorageService);
  private loginService = inject<LoginService>(LoginService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ssrDebug = inject<any>('SSR_DEBUG' as any, { optional: true });

  // Component state
  private isBrowser: boolean;

  // Form state
  loginForm: FormGroup;
  otpForm: FormGroup;
  readonly stepSignal = signal<'credentials' | 'otp'>('credentials');
  get step(): 'credentials' | 'otp' {
    return this.stepSignal();
  }
  set step(val: 'credentials' | 'otp') {
    this.stepSignal.set(val);
  }

  readonly hidePasswordSignal = signal(true);
  get hidePassword(): boolean {
    return this.hidePasswordSignal();
  }
  set hidePassword(val: boolean) {
    this.hidePasswordSignal.set(val);
  }

  readonly isSubmittingSignal = signal(false);
  get isSubmitting(): boolean {
    return this.isSubmittingSignal();
  }
  set isSubmitting(val: boolean) {
    this.isSubmittingSignal.set(val);
  }

  readonly showOtpFormSignal = signal(false);
  get showOtpForm(): boolean {
    return this.showOtpFormSignal();
  }
  set showOtpForm(val: boolean) {
    this.showOtpFormSignal.set(val);
  }

  readonly resendCountdownSignal = signal(0);
  get resendCountdown(): number {
    return this.resendCountdownSignal();
  }
  set resendCountdown(val: number) {
    this.resendCountdownSignal.set(val);
  }

  readonly resendDisabledSignal = signal(false);
  get resendDisabled(): boolean {
    return this.resendDisabledSignal();
  }
  set resendDisabled(val: boolean) {
    this.resendDisabledSignal.set(val);
  }

  readonly countdownSignal = signal(30);
  get countdown(): number {
    return this.countdownSignal();
  }
  set countdown(val: number) {
    this.countdownSignal.set(val);
  }

  readonly emailSignal = signal('');
  get email(): string {
    return this.emailSignal();
  }
  set email(val: string) {
    this.emailSignal.set(val);
  }

  readonly userTypeSignal = signal<'owner' | 'staff' | 'customer' | null>(null);
  get userType(): 'owner' | 'staff' | 'customer' | null {
    return this.userTypeSignal();
  }
  set userType(val: 'owner' | 'staff' | 'customer' | null) {
    this.userTypeSignal.set(val);
  }

  readonly isOtpStep = computed(() => this.stepSignal() === 'otp');
  readonly canResendOtp = computed(() => !this.resendDisabledSignal() && this.resendCountdownSignal() <= 0);

  // Private state
  private resendTimer: any;
  private returnUrl = '';

  // Debug logging helper methods
  private logDebug(message: string, data?: any) {
    if (this.ssrDebug?.log) {
      this.ssrDebug.log(`[LoginComponent] ${message}`, data);
    } else if (this.isBrowser) {
      console.log(`[LoginComponent] ${message}`, data || '');
    }
  }

  private logError(message: string, error: any) {
    if (this.ssrDebug?.error) {
      this.ssrDebug.error(`[LoginComponent] ${message}`, error);
    } else if (this.isBrowser) {
      console.error(`[LoginComponent] ${message}`, error);
    }

    // Also log to error service if available
    try {
      if (this.errorService) {
        this.errorService.handleError(error);
      }
    } catch (e) {
      console.error('Error logging to error service:', e);
    }
  }

  constructor() {
    super();
    const platformId = this.platformId;

    this.isBrowser = isPlatformBrowser(this.platformId);

    // Log constructor execution for debugging
    this.logDebug('LoginComponent constructor called', {
      isBrowser: this.isBrowser,
      platformId: platformId.toString(),
    });

    // Initialize userType to null
    this.userType = null;

    // Initialize forms with default values
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  /**
   * Initialize forms
   */
  private initForms(): void {
    // Forms are already initialized in the constructor
  }

  /**
   * Start OTP resend countdown
   */
  private startCountdown(): void {
    this.resendDisabled = true;
    this.countdown = 30;

    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.resendDisabled = false;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  public override async ngOnInit(): Promise<void> {
    super.ngOnInit();

    // Read returnUrl from query params (set by guards)
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

    // Load saved email if in browser environment
    if (this.isBrowser) {
      try {
        const savedEmail = await firstValueFrom(this.storageService.getItem$<string>('savedEmail'));
        if (savedEmail) {
          this.loginForm.patchValue({
            email: savedEmail,
            rememberMe: true,
          });
        }
      } catch (error) {
        console.warn('Failed to load saved email:', error);
      }
    }

    this.initForms();
    this.startCountdown();
  }

  override ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const { email, rememberMe } = this.loginForm.value as { email: string; rememberMe: boolean };

    // Save email to storage if rememberMe is checked (browser only)
    if (this.isBrowser) {
      try {
        if (rememberMe) {
          await firstValueFrom(this.storageService.setItem$('savedEmail', email));
        } else {
          await firstValueFrom(this.storageService.removeItem$('savedEmail'));
        }
      } catch (error) {
        console.warn('Failed to update saved email:', error);
      }
    }

    this.loginService
      .initLogin(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.userType = res.userType;

          if (res.userType === 'owner' || res.userType === 'staff') {
            // OTP required, move to OTP step
            this.step = 'otp';
            this.loading = false;
          } else if (res.userType === 'customer') {
            // No OTP required, login complete
            this.loading = false;
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.loading = false;
            this.error = 'Unknown user type';
          }
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.error?.error || 'Login failed';
          this.errorService.handleError(error);
          this.cdr.markForCheck();
        },
      });
  }

  async onOtpSubmit(): Promise<void> {
    if (this.otpForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const otp: string = this.otpForm.value.otp || '';

    this.loginService
      .verifyOtp({ email: this.loginForm.value.email, otp, type: 'login' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (user: CustomerAuthUser) => {
          if (!user) {
            this.error = 'Login failed: No response from server.';
            this.loading = false;
            return;
          }

          // Store token if available (browser only)
          if (this.isBrowser && user.accessToken) {
            try {
              await firstValueFrom(this.storageService.setItem$('access_token', user.accessToken));
            } catch (error) {
              console.warn('Failed to store auth token:', error);
            }
          }

          this.loading = false;
          this.cdr.markForCheck();
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.message || 'Invalid OTP';
          this.errorService.handleError(error);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Start the resend OTP countdown
   * @param seconds Number of seconds for the countdown
   */
  private startResendCountdown(seconds: number): void {
    this.resendCountdown = seconds;
    this.resendDisabled = true;

    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }

    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendDisabled = false;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  resendOtp() {
    if (this.resendDisabled || this.loading) return;

    // Reset cooldown
    this.startResendCountdown(60);

    // Re-initiate login to trigger OTP resend
    this.loginService
      .initLogin(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // OTP resent successfully
          this.error = null;
        },
        error: (err: unknown) => {
          this.error = this.errorService.getErrorMessage(err);
        },
      });
  }

  /**
   * Resend OTP code to the user's email
   */
  resendCode(event: Event): void {
    event.preventDefault();

    const email = this.loginForm.get('email')?.value || this.email;
    if (!email) {
      this.error = 'No email address found. Please try logging in again.';
      return;
    }

    this.loading = true;
    this.error = null;

    // Re-initiate login to trigger OTP resend
    this.loginService
      .initLogin(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.error = null;
          this.startResendCountdown(60);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = 'An error occurred while resending OTP. Please try again.';
          this.errorService.handleError(err);
        },
      });
  }

  /**
   * Handle social login button clicks
   * @param provider The social provider to use for login
   */
  loginWithSocial(provider: 'google' | 'facebook'): void {
    this.loading = true;
    this.error = null;

    // In a real implementation, this would open a popup or redirect to the provider's OAuth page
    // and return an OAuth token. For now, we'll simulate the OAuth flow with a delay
    // In a real app, you would get the token from the OAuth provider's response
    const oauthToken = 'simulated-oauth-token';

    this.loginService
      .socialLogin(provider, oauthToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: any) => {
          try {
            if (res.token) {
              if (this.isBrowser) {
                localStorage.setItem('access_token', res.token);

                // Store user data if available
                if (res.user) {
                  localStorage.setItem('user', JSON.stringify(res.user));
                }
              }

              // Redirect to dashboard or intended URL
              const target = this.returnUrl || '/dashboard';
              this.logDebug('Redirecting to:', target);
              this.router.navigateByUrl(target);
            } else {
              this.error = 'Authentication failed. Please try again.';
              this.logError('Authentication failed:', this.error);
            }
          } catch (error) {
            this.logError('Error in social login:', error);
            this.error = 'An error occurred during login';
          } finally {
            this.loading = false;
          }
        },
        (err: any) => {
          this.loading = false;
          this.error = err.error?.error || 'Social login failed';
          this.logError('Social login error:', this.error);
          if (this.errorService) {
            this.errorService.handleError(err);
          }
        },
      );
  }
}
