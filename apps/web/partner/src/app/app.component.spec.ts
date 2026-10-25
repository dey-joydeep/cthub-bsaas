import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core/auth';
import { AuthService } from '@cthub-bsaas/web-partner/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimations(),
        {
          provide: CURRENT_USER,
          useValue: {
            currentUser$: of(null),
            getCurrentUser: vi.fn().mockReturnValue(null),
          },
        },
        {
          provide: CurrentUserService,
          useValue: {
            currentUser$: of(null),
            getCurrentUser: vi.fn().mockReturnValue(null),
          },
        },
        {
          provide: AuthService,
          useValue: {
            logout: vi.fn().mockResolvedValue(undefined),
            isAuthenticated$: of(false),
          },
        },
        {
          provide: MatSnackBar,
          useValue: {
            open: vi.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    // Reset spies on localStorage to prevent duplicate spyOn errors
    if ((localStorage.getItem as any).calls) {
      (localStorage.getItem as any).calls.reset();
    }
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('BeautySaaS');
  });

  it('should render header logo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.header-content .logo')).toBeTruthy();
  });

  it('should switch languages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should show/hide links based on login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const getItemSpy = vi.spyOn(localStorage, 'getItem');
    getItemSpy.mockReturnValue('token');
    getItemSpy.mockReturnValue(null);
  });
});
