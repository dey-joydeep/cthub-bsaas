import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Renewal } from './models/renewals-list-widget.model';

@Injectable({ providedIn: 'root' })
export class RenewalsListWidgetService {
  constructor(private http: HttpClient) {}

  getRenewals(tenantId: string): Observable<Renewal[]> {
    // Simulate API call
    return of([
      {
        salonName: 'Beauty Salon A',
        renewalDate: new Date().toISOString(),
        amount: 100,
        status: 'pending',
      },
      {
        salonName: 'Beauty Salon B',
        renewalDate: new Date().toISOString(),
        amount: 150,
        status: 'overdue',
      },
    ]);
  }
}
