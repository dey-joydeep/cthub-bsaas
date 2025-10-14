import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

// Components
import { LoginComponent } from './login.component';

// Services
import { NotificationService } from '@cthub-bsaas/web-core/http';
import { AuthService } from '../../services/auth.service';

// Mocks
class MockTranslateService {
  get = jest.fn().mockReturnValue(of('translated text'));
  instant = jest.fn().mockReturnValue('translated text');
  use = jest.fn().mockReturnValue(of({}));
  setDefaultLang = jest.fn();
  getBrowserLang = jest.fn().mockReturnValue('en');
  getLangs = jest.fn().mockReturnValue(['en', 'es']);
  onLangChange = { subscribe: jest.fn() };
  onTranslationChange = { subscribe: jest.fn() };
  onDefaultLangChange = { subscribe: jest.fn() };
}

class MockAuthService implements Partial<AuthService> {
  login = jest.fn().mockReturnValue(
    of({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    }),
  );
  isAuthenticated = jest.fn().mockReturnValue(false);
  getCurrentUser = jest.fn().mockReturnValue(null);
  logout = jest.fn().mockReturnValue(of(true));
  getToken = jest.fn().mockReturnValue('test-token');
  getRefreshToken = jest.fn().mockReturnValue('refresh-token');
  refreshToken = jest.fn().mockReturnValue(
    of({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
      accessToken: 'new-test-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    }),
  );
}

class MockNotificationService {
  error = jest.fn();
  success = jest.fn();
  show = jest.fn();
  info = jest.fn();
  warning = jest.fn();
  clear = jest.fn();
  showError = jest.fn();
  showSuccess = jest.fn();
  showWarning = jest.fn();
  showInfo = jest.fn();
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: MockAuthService;
  let notificationService: MockNotificationService;
  let router: Router;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer',
    accessToken: 'test-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatSnackBarModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        LoginComponent,
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: TranslateService, useClass: MockTranslateService },
        provideRouter([]), // Use provideRouter instead of RouterTestingModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    notificationService = TestBed.inject(NotificationService) as unknown as MockNotificationService;
    router = TestBed.inject(Router);

    // Mock the login method
    authService.login.mockReturnValue(of(mockUser));

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

  it('should call authService.login and navigate on successful login', () => {
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password',
      rememberMe: true,
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle login error', () => {
    const error = { message: 'Login failed' };
    authService.login.mockReturnValue(throwError(() => error));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password',
      rememberMe: false,
    });

    component.onSubmit();

    expect(notificationService.error).toHaveBeenCalledWith('Login failed. Please check your credentials and try again.');
  });

  it('should show loading state during form submission', () => {
    // Set up form with valid data
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    // Trigger form submission
    component.onSubmit();

    // Check if loading state is set
    expect(component.isSubmitting).toBe(true);

    // Check if authService.login was called
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle login success', () => {
    // Set up form with valid data
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    // Mock successful login response
    authService.login.mockReturnValueOnce(
      of({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      }),
    );

    // Spy on router.navigate
    const navigateSpy = jest.spyOn(router, 'navigate');

    // Trigger form submission
    component.onSubmit();

    // Check if navigation occurred
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
