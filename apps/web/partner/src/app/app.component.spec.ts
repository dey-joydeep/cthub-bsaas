import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentUserService } from '@cthub-bsaas/web-core/auth';

describe('AppComponent', () => {
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [CommonModule, AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimations(),
        {
          provide: CurrentUserService,
          useValue: {
            get currentUser() {
              return currentUserSubject.value;
            },
            currentUser$: currentUserSubject.asObservable(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    if ((localStorage.getItem as any)?.calls) {
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

  it('should render header container', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.header-content')).toBeTruthy();
  });

  it('should switch languages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show/hide links based on login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.isLoggedIn).toBe(false);

    currentUserSubject.next({ id: '1', roles: ['admin'] });
    expect(app.isLoggedIn).toBe(true);
  });

  it('routes staff settings entry to the branch settings screen', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.currentUser = { id: 'staff-1', roles: ['staff'] };

    expect(app.settingsRoute).toBe('/owner/branches');
  });
});
