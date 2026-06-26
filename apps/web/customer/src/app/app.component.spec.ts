import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { type BaseAuthUser, CurrentUserService } from '@cthub-bsaas/web-core/auth';
import { AuthService } from '@cthub-bsaas/web-customer/auth';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const logout = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
  const snackBar = { open: jest.fn() };

  async function renderComponent(currentUser: BaseAuthUser | null = null) {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout } },
        { provide: CurrentUserService, useValue: { currentUser$: of(currentUser) } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    logout.mockClear();
    snackBar.open.mockClear();
    TestBed.resetTestingModule();
  });

  it('creates the app with the expected title', async () => {
    const fixture = await renderComponent();
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
    expect(app.title).toBe('BeautySaaS');
  });

  it('shows login actions when there is no authenticated user', async () => {
    const fixture = await renderComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.auth-buttons')).toBeTruthy();
    expect(compiled.querySelector('.main-nav')).toBeNull();
  });

  it('shows the main navigation when a user is authenticated', async () => {
    const fixture = await renderComponent({ id: 'user-1' });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.main-nav')).toBeTruthy();
    expect(compiled.querySelector('.auth-buttons')).toBeNull();
  });
});
