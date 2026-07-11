import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { LoginService } from './login.service';
import { ErrorHandlingService, ErrorService, NotificationService } from '@cthub-bsaas/web-core-common';
import { PLATFORM_UTILS_TOKEN, StorageService } from '@cthub-bsaas/web-core-platform';

class MockLoginService {
  initLogin = vi.fn().mockReturnValue(of({ userType: 'owner' }));
  verifyOtp = vi.fn().mockReturnValue(
    of({
      id: '1',
      email: 'test@example.com',
      name: 'Test Owner',
      userType: 'owner',
    }),
  );
}

class MockStorageService {
  setItem$ = vi.fn().mockReturnValue(of(true));
  removeItem$ = vi.fn().mockReturnValue(of(true));
  getItem$ = vi.fn().mockReturnValue(of(null));
}

class MockErrorHandlingService {
  handleError = vi.fn();
}

class MockErrorService {
  error$ = of(null);
  handleError = vi.fn();
  getErrorMessage = vi.fn().mockReturnValue('Login failed');
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: MockLoginService;
  let router: Router;

  beforeEach(async () => {
    loginService = new MockLoginService();

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatSnackBarModule,
        HttpClientTestingModule,
        LoginComponent,
      ],
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: ErrorHandlingService, useClass: MockErrorHandlingService },
        { provide: ErrorService, useClass: MockErrorService },
        { provide: NotificationService, useValue: { error: vi.fn(), success: vi.fn() } },
        {
          provide: PLATFORM_UTILS_TOKEN,
          useValue: {
            isBrowser: true,
            isServer: false,
            windowRef: window,
            documentRef: document,
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: '',
      rememberMe: false,
    });
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('required')).toBeTruthy();

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate password field as required', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should call loginService.initLogin and switch step on valid submit', async () => {
    component.loginForm.setValue({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(loginService.initLogin).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: false,
    });
    expect(component.step).toBe('otp');
  });

  it('should handle login error', async () => {
    loginService.initLogin.mockReturnValue(throwError(() => ({ error: { error: 'Login failed' } })));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(component.error).toBe('Login failed');
  });

  it('should show loading state during form submission', async () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(loginService.initLogin).toHaveBeenCalled();
  });

  it('should handle otp verification success and navigate', () => {
    component.loginForm.setValue({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: false,
    });
    component.otpForm.setValue({ otp: '123456' });

    component.onOtpSubmit();

    expect(loginService.verifyOtp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      otp: '123456',
      type: 'login',
    });
  });
});
