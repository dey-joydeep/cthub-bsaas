import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { AuthService } from '@cthub-bsaas/web-partner/auth';
import { CURRENT_USER } from '@cthub-bsaas/web-core/auth';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimations(),
        { provide: AuthService, useValue: { logout: jest.fn() } },
        { provide: CURRENT_USER, useValue: { currentUser$: of(null) } },
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    // Reset spies on localStorage to prevent duplicate spyOn errors
    const getItemMock = localStorage.getItem as jest.Mock | undefined;
    if (getItemMock?.mockReset) {
      getItemMock.mockReset();
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

  it('should render the app header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-header .logo a')?.textContent).toContain('BeautySaaS');
  });

  it('should show/hide links based on login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app.isLoggedIn).toBe(false);
  });

  it('routes manager-capable staff settings entry to the branch settings screen', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.currentUser = {
      id: 'staff-1',
      roles: ['staff'],
      managedBranchIds: ['branch-1'],
    };

    expect(app.canManageBranches).toBe(true);
    expect(app.settingsRoute).toBe('/owner/branches');
  });

  it('suppresses settings route for non-manager staff', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.currentUser = {
      id: 'staff-2',
      roles: ['staff'],
      managedBranchIds: [],
    };

    expect(app.canManageBranches).toBe(false);
    expect(app.settingsRoute).toBeNull();
  });

  it('routes owner settings entry to the settings screen', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.currentUser = {
      id: 'owner-1',
      roles: ['owner'],
    };

    expect(app.canManageBranches).toBe(true);
    expect(app.settingsRoute).toBe('/settings');
  });
});
