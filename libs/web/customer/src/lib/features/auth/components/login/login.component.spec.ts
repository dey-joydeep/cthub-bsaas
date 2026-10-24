import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { PLATFORM_UTILS_TOKEN, StorageService } from '@cthub-bsaas/web-core-platform';
import { ErrorService } from '@cthub-bsaas/web-core-common';
import { LoginComponent } from './login.component';
import { LoginService } from './login.service';

class MockErrorService {
  error$ = of(null);
  handleError = jest.fn();
  getErrorMessage = jest.fn().mockReturnValue('Error');
}

class MockStorageService {
  getItem$ = jest.fn().mockReturnValue(of(null));
  setItem$ = jest.fn().mockReturnValue(of(true));
  removeItem$ = jest.fn().mockReturnValue(of(true));
}

class MockLoginService {
  initLogin = jest.fn().mockReturnValue(of({ userType: 'owner' }));
  verifyOtp = jest.fn().mockReturnValue(
    of({
      id: '1',
      email: 'customer@example.com',
      accessToken: 'token-123',
    }),
  );
}

const mockPlatformUtils = {
  isBrowser: () => true,
  isServer: () => false,
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: MockLoginService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TranslateModule.forRoot(), LoginComponent],
      providers: [
        { provide: LoginService, useClass: MockLoginService },
        { provide: StorageService, useClass: MockStorageService },
        { provide: ErrorService, useClass: MockErrorService },
        { provide: PLATFORM_UTILS_TOKEN, useValue: mockPlatformUtils },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    loginService = TestBed.inject(LoginService) as unknown as MockLoginService;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: '',
      rememberMe: false,
    });
  });

  it('should validate email field as required and valid email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('required')).toBeTruthy();

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should call loginService.initLogin on submit with valid credentials', async () => {
    component.loginForm.setValue({
      email: 'customer@example.com',
      password: 'password123',
      rememberMe: true,
    });

    await component.onSubmit();

    expect(loginService.initLogin).toHaveBeenCalledWith({
      email: 'customer@example.com',
      password: 'password123',
      rememberMe: true,
    });
    expect(component.step).toBe('otp');
  });

  it('should handle initLogin error', async () => {
    loginService.initLogin.mockReturnValueOnce(throwError(() => ({ error: { error: 'Invalid credentials' } })));

    component.loginForm.setValue({
      email: 'customer@example.com',
      password: 'wrongpassword',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Invalid credentials');
  });

  it('should verify OTP and navigate on success', async () => {
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));

    component.loginForm.setValue({
      email: 'customer@example.com',
      password: 'password123',
      rememberMe: false,
    });
    component.otpForm.setValue({ otp: '123456' });

    await component.onOtpSubmit();
    await new Promise(process.nextTick);

    expect(loginService.verifyOtp).toHaveBeenCalledWith({
      email: 'customer@example.com',
      otp: '123456',
      type: 'login',
    });
    expect(navigateSpy).toHaveBeenCalled();
  });
});
