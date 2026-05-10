import { Injectable } from '@angular/core';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private storageService: StorageService) {}

  getTenantId(): Observable<string | null> {
    return this.storageService.getItem$<string>('tenantId');
  }
}
