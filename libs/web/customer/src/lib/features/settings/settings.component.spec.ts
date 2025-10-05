import { TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { sharedTestProviders } from '../../shared/test-setup';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, SettingsComponent, TranslateModule.forRoot()],
      providers: [...sharedTestProviders, provideRouter([]), provideAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
