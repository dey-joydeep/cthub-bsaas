import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatError } from '@angular/material/form-field';
import { DashboardApiService, ProductSalesData } from '@cthub-bsaas/features/dashboard/services/dashboard-api.service';

@Component({
  selector: 'app-product-sales-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatProgressBarModule, MatError],
  templateUrl: './product-sales-chart.component.html',
  styleUrls: ['./product-sales-chart.component.scss'],
})
export class ProductSalesChartComponent implements OnInit {
  @Input() tenantId = '';
  data = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  options: ChartOptions<'bar'> = { responsive: true };
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(DashboardApiService);

  ngOnInit() {
    if (!this.tenantId) return;
    this.loading.set(true);
    this.api.getProductSales(this.tenantId).subscribe({
      next: (res: ProductSalesData) => {
        this.data.set(res);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load product sales');
        this.loading.set(false);
      },
    });
  }
}
