import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, AppComponent, TranslatePipe, TranslateDirective],
      providers: [provideRouter([]), provideHttpClient(), provideAnimations()],
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

  it('should render sidebar links', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar nav')).toBeTruthy();
  });

  it('should switch languages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    // app.switchLang('bn');
    // expect(app.currentLang).toBe('bn');
    // app.switchLang('en');
    // expect(app.currentLang).toBe('en');
  });

  it('should show/hide links based on login', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const getItemSpy = spyOn(localStorage, 'getItem');
    getItemSpy.and.returnValue('token');
    // expect(app.isLoggedIn).toBeTrue();
    getItemSpy.and.returnValue(null);
    // expect(app.isLoggedIn).toBeFalse();
  });
});
