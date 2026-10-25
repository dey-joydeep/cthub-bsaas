// Core
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, inject, OnDestroy, OnInit, Optional, PLATFORM_ID } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';

// Services
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils, StorageService } from '@cthub-bsaas/web-core-platform';
import { LoginService } from './login.service';
import type { InitLoginResponse, PartnerAuthUser } from '../../models/auth.models';

@Component({
  standalone: true,
  imports: [
    // Angular Modules
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    // Angular Material Modules
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,

    // Third-party Modules
    TranslateModule,
  ],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends AbstractBaseComponent implements OnInit, OnDestroy {
  // Component state
  private isBrowser: boolean;

  // Form state
  loginForm: FormGroup;
  otpForm: FormGroup;
  step: 'credentials' | 'otp' = 'credentials';
  hidePassword = true;
  isSubmitting = false;

  // OTP related state
  showOtpForm = false;
  resendCountdown = 0;
  resendDisabled = false;
  countdown = 30;
  email = '';
  userType: 'owner' | 'staff' | 'customer' | null = null;

  // Private state
  private resendTimer: any;
  private returnUrl = '';
  protected platformUtils = inject<PlatformUtils>(PLATFORM_UTILS_TOKEN);

  // Debug logging helper methods
  private logDebug(message: string, data?: any) {
    if (this.ssrDebug?.log) {
      this.ssrDebug.log(`[LoginComponent] ${message}`, data);
    } else if (this.isBrowser) {
      console.log(`[LoginComponent] ${message}`, data || '');
    }
  }

  // Social login handler (stub). Replace with real token retrieval and API call when available.
  loginWithSocial(provider: 'google' | 'facebook'): void {
    this.error = `${provider} social login is not implemented yet.`;
  }

  // Removed unused logError() to satisfy noUnusedLocals

  constructor(
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(Router) private router: Router,
    @Inject(ActivatedRoute) private route: ActivatedRoute,
    @Inject(StorageService) private storageService: StorageService,
    @Inject(LoginService) private loginService: LoginService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Optional() @Inject('SSR_DEBUG') private ssrDebug: any,
  ) {
    super();
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
        next: (res: InitLoginResponse) => {
          this.userType = res.userType;

          if (res.userType === 'owner' || res.userType === 'staff') {
            // OTP required, move to OTP step
            this.step = 'otp';
            this.loading = false;
          } else if (res.userType === 'customer') {
            // No OTP required, login complete
            this.loading = false;
            this.error = 'Unknown user type';
          } else {
            this.loading = false;
            this.error = 'Unknown user type';
          }
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.error?.error || 'Login failed';
          this.errorService.handleError(error);
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
        next: async (user: PartnerAuthUser) => {
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
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error: any) => {
          this.loading = false;
          this.error = error.message || 'Invalid OTP';
          this.errorService.handleError(error);
        },
      });
  }

  /**
   * Start the resend OTP countdown
   * @param seconds Number of seconds for the countdown
   */
  private startResendCountdown(seconds: number): void {
    this.resendDisabled = true;
    this.countdown = seconds;

    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.resendDisabled = false;
      }
    }, 1000);
  }

  resendOtp() {
    if (this.resendDisabled || this.loading) return;

    // Reset cooldown
    this.startResendCountdown(60);

    this.loginService
      .initLogin(this.loginForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // OTP resent successfully
          this.error = null;
        },
        error: (err: unknown) => {
          this.error = this.errorService.getErrorMessage(err as any);
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
          this.errorService.handleError(err as any);
        },
      });
  }
}
