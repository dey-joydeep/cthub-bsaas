import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

// Components
import { LoginComponent } from './login.component';

// Services
import { ErrorService, NotificationService } from '@cthub-bsaas/web-core-common';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { LoginService } from './login.service';
import { AUTH_STATE_SETTER, LOGIN_API, type AuthStateSetter, type LoginApiPort } from '../../tokens/login.tokens';

class MockNotificationService {
  error = vi.fn();
  success = vi.fn();
  show = vi.fn();
  info = vi.fn();
  warning = vi.fn();
  clear = vi.fn();
  showError = vi.fn();
  showSuccess = vi.fn();
  showWarning = vi.fn();
  showInfo = vi.fn();
}

class MockErrorService {
  handleError = vi.fn();
  error$ = of(null);
}

class MockStorageService {
  setItem$ = vi.fn().mockReturnValue(of(true));
  removeItem$ = vi.fn().mockReturnValue(of(true));
  getItem$ = vi.fn().mockReturnValue(of(null));
  clear$ = vi.fn().mockReturnValue(of(true));
}

class MockLoginApi implements LoginApiPort {
  login = vi.fn().mockReturnValue(of({ data: {} }));
  initLogin = vi.fn().mockReturnValue(of({ data: { userType: 'customer' } }));
  verifyOtp = vi.fn().mockReturnValue(of({ data: {} }));
  socialLogin = vi.fn().mockReturnValue(of({ data: {} }));
  resendOtp = vi.fn().mockReturnValue(of({ data: { success: true } }));
}

class MockAuthStateSetter implements AuthStateSetter {
  setLoggedInUser = vi.fn();
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: LoginService;
  let errorService: MockErrorService;
  let router: Router;

  beforeEach(async () => {
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
        { provide: LOGIN_API, useClass: MockLoginApi },
        { provide: AUTH_STATE_SETTER, useClass: MockAuthStateSetter },
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: ErrorService, useClass: MockErrorService },
        { provide: StorageService, useClass: MockStorageService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    loginService = TestBed.inject(LoginService);
    errorService = TestBed.inject(ErrorService) as unknown as MockErrorService;
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

  it('should call loginService.initLogin and navigate on successful login', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    const initLoginSpy = vi.spyOn(loginService, 'initLogin');

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password',
      rememberMe: true,
    });

    await component.onSubmit();

    expect(initLoginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      rememberMe: true,
    });
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle login error', async () => {
    const error = { error: { error: 'Login failed' } };
    vi.spyOn(loginService, 'initLogin').mockReturnValue(throwError(() => error));
    const errorSpy = vi.spyOn((component as any).errorService, 'handleError');

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(component.error).toBe('Login failed');
    expect(errorSpy).toHaveBeenCalledWith(error);
  });

  it('should show loading state during form submission', async () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    const initLoginSpy = vi.spyOn(loginService, 'initLogin').mockReturnValue(new Subject() as any);

    await component.onSubmit();

    expect(component.loading).toBe(true);
    expect(initLoginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });
  });

  it('should handle login success', async () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    vi.spyOn(loginService, 'initLogin').mockReturnValueOnce(
      of({
        userType: 'customer',
      }),
    );

    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));

    await component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('should transition to otp step if userType is owner', async () => {
    component.loginForm.setValue({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: false,
    });

    vi.spyOn(loginService, 'initLogin').mockReturnValueOnce(
      of({
        userType: 'owner',
      }),
    );

    await component.onSubmit();

    expect(component.step).toBe('otp');
    expect(component.loading).toBe(false);
  });
});
