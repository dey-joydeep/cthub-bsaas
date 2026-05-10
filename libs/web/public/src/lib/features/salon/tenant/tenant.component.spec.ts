import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SalonProfileComponent } from './salon-profile.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

describe('SalonProfileComponent', () => {
  let component: SalonProfileComponent;
  let fixture: ComponentFixture<SalonProfileComponent>;
  let httpMock: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SalonProfileComponent, // Standalone
        HttpClientTestingModule,
        FormsModule,
        TranslateModule.forRoot(),
        SafeUrlPipe,
      ],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalonProfileComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch salon and reviews on init', () => {
    const mockSalon = {
      id: '1',
      name: 'Salon Test',
      address: '123 Main',
      zipCode: '00000',
      city: 'Test City',
      latitude: 1,
      longitude: 2,
      services: [],
      staff: [],
      ownerId: 'owner',
      imageUrl: '',
      images: [],
      reviews: [],
      phone: '',
      description: '',
      rating: 5,
      reviewCount: 1,
    };
    const mockReviews = [{ reviewer: 'User', rating: 5, comment: 'Great!', createdAt: new Date() }];
    fixture.detectChanges();
    const req1 = httpMock.expectOne('/api/salons/1');
    expect(req1.request.method).toBe('GET');
    req1.flush(mockSalon);
    const req2 = httpMock.expectOne('/api/salon/1/reviews');
    expect(req2.request.method).toBe('GET');
    req2.flush(mockReviews);
    expect(component.salon).toMatchObject({ id: '1', name: 'Salon Test' });
    expect(component.reviews.length).toBe(1);
    // Use type assertion to access protected loading property for testing
    expect((component as any).loading).toBeFalse();
  });
});
