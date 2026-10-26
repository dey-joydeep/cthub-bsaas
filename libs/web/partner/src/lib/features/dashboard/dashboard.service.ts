import { Injectable, inject } from '@angular/core';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly storageService = inject(StorageService);

  getTenantId(): Observable<string | null> {
    return this.storageService.getItem$<string>('tenantId');
  }
}
