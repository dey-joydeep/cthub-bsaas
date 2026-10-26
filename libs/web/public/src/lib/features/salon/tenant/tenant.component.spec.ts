import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TenantComponent } from './tenant.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SafeUrlPipe } from '@cthub-bsaas/web-ui';
import { TenantService } from './tenant.service';
import { CurrentUserService } from '@cthub-bsaas/web-core/auth';
import { Salon } from './model/tenant.model';

describe('TenantComponent', () => {
  let component: TenantComponent;
  let fixture: ComponentFixture<TenantComponent>;
  let tenantService: Partial<TenantService>;
  let currentUserService: Partial<CurrentUserService>;

  const mockSalon: Salon = {
    id: '1',
    name: 'Test Tenant Salon',
    address: '123 St',
    city: 'City',
    rating: 4.5,
    reviewCount: 10,
    imageUrl: 'url',
    services: [],
  };

  beforeEach(waitForAsync(() => {
    tenantService = {
      getSalon: vi.fn().mockReturnValue(of(mockSalon)),
      getSalonReviews: vi.fn().mockReturnValue(of([])),
      isEligibleForReview: vi.fn().mockReturnValue(of({ eligible: true })),
      submitReview: vi.fn().mockReturnValue(of({})),
      submitAppointment: vi.fn().mockReturnValue(of({})),
    };

    currentUserService = {
      currentUser: { id: 'user-1', email: 'user@test.com', name: 'User', role: 'customer' } as any,
    };

    TestBed.configureTestingModule({
      imports: [TenantComponent, HttpClientTestingModule, FormsModule, SafeUrlPipe],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: TenantService, useValue: tenantService },
        { provide: CurrentUserService, useValue: currentUserService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.salon).toEqual(mockSalon);
  });
});
