import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ErrorService } from '@cthub-bsaas/web-core-common';
import { PLATFORM_UTILS_TOKEN, StorageService } from '@cthub-bsaas/web-core-platform';

import { LoginService } from './login.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: {
    initLogin: jest.Mock;
    verifyOtp: jest.Mock;
    socialLogin: jest.Mock;
  };
  let storageService: {
    getItem$: jest.Mock;
    setItem$: jest.Mock;
    removeItem$: jest.Mock;
  };
  let router: Router;

  beforeEach(async () => {
    loginService = {
      initLogin: jest.fn(),
      verifyOtp: jest.fn(),
      socialLogin: jest.fn(),
    };
    storageService = {
      getItem$: jest.fn().mockReturnValue(of(null)),
      setItem$: jest.fn().mockReturnValue(of(undefined)),
      removeItem$: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: loginService },
        { provide: StorageService, useValue: storageService },
        { provide: PLATFORM_UTILS_TOKEN, useValue: { isBrowser: true, windowRef: globalThis.window } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: jest.fn().mockReturnValue('/dashboard'),
              },
            },
          },
        },
        {
          provide: ErrorService,
          useValue: {
            error$: of(null),
            handleError: jest.fn(),
            getErrorMessage: jest.fn().mockReturnValue('Something went wrong'),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    expect(component.loginForm.getRawValue()).toEqual({
      email: '',
      password: '',
      rememberMe: false,
    });
  });

  it('should advance to otp step for owner login', async () => {
    loginService.initLogin.mockReturnValue(
      of({
        userType: 'owner',
      }),
    );

    component.loginForm.setValue({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: true,
    });

    await component.onSubmit();

    expect(storageService.setItem$).toHaveBeenCalledWith('savedEmail', 'owner@example.com');
    expect(loginService.initLogin).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password123',
      rememberMe: true,
    });
    expect(component.step).toBe('otp');
  });

  it('should navigate for customer login', async () => {
    const navigateByUrl = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    loginService.initLogin.mockReturnValue(
      of({
        userType: 'customer',
      }),
    );

    component.loginForm.setValue({
      email: 'customer@example.com',
      password: 'password123',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(storageService.removeItem$).toHaveBeenCalledWith('savedEmail');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should surface login init errors', async () => {
    loginService.initLogin.mockReturnValue(
      throwError(() => ({
        error: {
          error: 'Login failed',
        },
      })),
    );

    component.loginForm.setValue({
      email: 'customer@example.com',
      password: 'bad-password',
      rememberMe: false,
    });

    await component.onSubmit();

    expect(component.error).toBe('Login failed');
  });
});
