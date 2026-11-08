import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: any;

  beforeEach(async () => {
    const mockDashboardService = {
      getTenantId: vi.fn().mockReturnValue(of('demo-tenant')),
    };

    const mockPlatformUtils = {
      windowRef: {
        innerWidth: 1024,
      },
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: PLATFORM_UTILS_TOKEN, useValue: mockPlatformUtils },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
