import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { firstValueFrom, of } from 'rxjs';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockStorageService: { getItem$: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockStorageService = {
      getItem$: vi.fn().mockReturnValue(of('demo-tenant')),
    };

    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: StorageService, useValue: mockStorageService }],
    });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get tenant id from storage service', async () => {
    const tenantId = await firstValueFrom(service.getTenantId());
    expect(tenantId).toBe('demo-tenant');
    expect(mockStorageService.getItem$).toHaveBeenCalledWith('tenantId');
  });
});
