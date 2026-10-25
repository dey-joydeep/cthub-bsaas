import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { RevenueData } from './models/revenue-chart-widget.model';

@Injectable({ providedIn: 'root' })
export class RevenueChartWidgetService {
    private readonly http = inject(HttpClient);

  getRevenueData(): Promise<RevenueData[]> {
    // Simulate API call
    return Promise.resolve([
      { date: '2023-01-01', amount: 1000 },
      { date: '2023-01-02', amount: 1200 },
      { date: '2023-01-03', amount: 1500 },
      { date: '2023-01-04', amount: 1300 },
      { date: '2023-01-05', amount: 1700 },
    ]);
  }
}
