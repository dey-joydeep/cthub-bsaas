import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle error responses gracefully', (done) => {
    service.getStats().then(
      () => fail('should have errored'),
      (err) => {
        expect(err).toBeDefined();
        done();
      },
    );
    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/stats`);
    req.flush({ message: 'Failed to fetch stats.' }, { status: 500, statusText: 'Server Error' });
  });
});
