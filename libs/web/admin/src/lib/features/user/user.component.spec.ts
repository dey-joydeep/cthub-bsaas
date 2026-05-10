import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserComponent } from './user.component';
import { UserService } from './user.service';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { sharedTestProviders } from '../../shared/test-setup';
import { By } from '@angular/platform-browser';

// Create a mock for TranslateService
class MockTranslateService {
  currentLang = 'en';
  translations: Record<string, Record<string, string>> = {
    en: {
      'USER.ERRORS.PERMISSION_DENIED': 'You do not have permission to view this data.',
      'USER.ERRORS.SESSION_EXPIRED': 'Your session has expired. Please log in again.',
      'USER.ERRORS.FORBIDDEN': 'You do not have permission to access this resource.',
    },
  };

  getTranslation(lang: string): Record<string, string> | undefined {
    return this.translations[lang];
  }

  setTranslation(lang: string, translations: Record<string, string>): void {
    this.translations[lang] = { ...this.translations[lang], ...translations };
  }

  get(key: string | string[], interpolateParams?: object): string {
    const keys = Array.isArray(key) ? key : [key];
    const translation = keys
      .map((k) => {
        const parts = k.split('.');
        let result: any = this.translations[this.currentLang];
        for (const part of parts) {
          result = result?.[part];
          if (result === undefined) return k;
        }
        return result || k;
      })
      .join(' ');

    if (interpolateParams) {
      return Object.entries(interpolateParams).reduce(
        (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
        translation,
      );
    }
    return translation;
  }
}

const adminToken = `
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
  eyJ1c2VyX2lkIjoiYWRtaW4iLCJ0ZW5hbnRfaWQiOiJ0ZW5hbnQxIiwiZW1haWwiOiJhZG1pbkBiLmNvbSIsInJvbGUiOiJhZG1pbiJ9.
  4c1wA3H3w2v1vYbN8i4Q8o3l7w1t8w2v9w1t8w2v9w1t8w2v9w1t8w2v9w1t8w2v9
`;

const userToken = `
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
  eyJ1c2VyX2lkIjoiYWRtaW4iLCJ0ZW5hbnRfaWQiOiJ0ZW5hbnQxIiwiZW1haWwiOiJhZG1pbkBiLmNvbSIsInJvbGUiOiJ1c2VyIn0.
  4c1wA3H3w2v1vYbN8i4Q8o3l7w1t8w2v9w1t8w2v9w1t8w2v9w1t8w2v9w1t8w2v9
`;

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let userService: jest.Mocked<UserService>;
  let translateService: TranslateService;

  beforeEach(async () => {
    userService = {
      getUserStats: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    await TestBed.configureTestingModule({
      imports: [CommonModule, UserComponent, TranslateModule.forRoot()],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    translateService.use('en');
  });

  it('should show stats for admin', () => {
    // Setup test data
    const mockStats = {
      businessCount: 2,
      customerCount: 5,
      activeBusiness: 1,
      activeCustomer: 3,
    };

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return adminToken;
      if (key === 'tenant_id') return 'test-tenant';
      return null;
    });

    // Setup service response
    userService.getUserStats.mockReturnValue(of(mockStats));

    // Trigger change detection
    fixture.detectChanges();

    // Test public property
    expect(component.isAdmin).toBeTrue();

    // Check if the stats are rendered in the DOM
    const statElements = fixture.debugElement.queryAll(By.css('.stat-card'));
    expect(statElements.length).toBe(4);

    // Check if the stats are displayed correctly
    const statText = fixture.debugElement.nativeElement.textContent;
    expect(statText).toContain('2'); // businessCount
    expect(statText).toContain('5'); // customerCount
    expect(statText).toContain('1'); // activeBusiness
    expect(statText).toContain('3'); // activeCustomer

    // Verify no error message is shown
    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement).toBeNull();
  });

  it('should block stats for non-admin', () => {
    // Mock localStorage for non-admin
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return userToken;
      if (key === 'tenant_id') return 'test-tenant';
      return null;
    });

    // Mock getUserStats to throw an error if called (shouldn't be called for non-admin)
    userService.getUserStats.mockImplementation(() => {
      throw new Error('getUserStats should not be called for non-admin');
    });

    // Trigger change detection
    fixture.detectChanges();

    // Test public property
    expect(component.isAdmin).toBeFalse();

    // Check if the error message is displayed in the DOM
    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('permission');

    // Verify no stats are shown
    const statElements = fixture.debugElement.queryAll(By.css('.stat-card'));
    expect(statElements.length).toBe(0);
  });

  it('should show session expired for 401', () => {
    // Mock localStorage
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'token') return adminToken;
      if (key === 'tenant_id') return 'test-tenant';
      return null;
    });

    // Setup error response
    userService.getUserStats.mockReturnValue(
      throwError(() => ({
        status: 401,
        error: { message: 'Session expired' },
      })),
    );

    // Trigger change detection
    fixture.detectChanges();

    // Test public property
    expect(component.isAdmin).toBeTrue();

    // Check if the error message is displayed in the DOM
    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('session');
  });

  it('should show forbidden for 403', () => {
    // Mock localStorage
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'token') return adminToken;
      if (key === 'tenant_id') return 'test-tenant';
      return null;
    });

    // Setup error response
    userService.getUserStats.mockReturnValue(
      throwError(() => ({
        status: 403,
        error: { message: 'Forbidden' },
      })),
    );

    // Trigger change detection
    fixture.detectChanges();

    // Test public property
    expect(component.isAdmin).toBeTrue();

    // Check if the error message is displayed in the DOM
    const errorElement = fixture.debugElement.query(By.css('.error-message'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('permission');
  });
});
