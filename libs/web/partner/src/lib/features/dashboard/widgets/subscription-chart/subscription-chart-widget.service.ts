import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SubscriptionData } from './models/subscription-chart-widget.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionChartWidgetService {
  constructor(private http: HttpClient) {}

  getSubscriptionData(): Observable<SubscriptionData[]> {
    // Simulate API call
    return of([
      { month: 'Jan', retentionRate: 85 },
      { month: 'Feb', retentionRate: 88 },
      { month: 'Mar', retentionRate: 90 },
      { month: 'Apr', retentionRate: 87 },
      { month: 'May', retentionRate: 92 },
    ]);
  }
}
