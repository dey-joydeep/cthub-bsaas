import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardApiService } from '@cthub-bsaas/features/dashboard/services/dashboard-api.service';

@Component({
  selector: 'app-subscription-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    MatCardModule,
    MatProgressBarModule,
    MatError,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './subscription-chart.component.html',
  styleUrls: ['./subscription-chart.component.scss'],
})
export class SubscriptionChartComponent implements OnInit {
  @Input() tenantId = '';
  chartType = 'bar' as const;
  data = signal<ChartData<typeof this.chartType, number[], string>>({
    labels: [],
    datasets: [],
  });

  // Method to load subscription data
  loadData(): void {
    if (!this.tenantId) {
      this.error.set('No tenant ID provided');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api.getSubscriptions(this.tenantId).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load subscription data');
        this.loading.set(false);
      },
    });
  }

  // Method to export data
  exportData(): void {
    // In a real implementation, this would export the data to a file
    console.log('Exporting subscription data:', this.data());
    // You could implement actual export logic here (e.g., CSV, Excel, etc.)
  }

  // Method to handle refresh button click
  onRefresh(): void {
    this.loadData();
  }

  options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Subscription Plans',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Subscribers',
        },
        beginAtZero: true,
      },
    },
  };
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(DashboardApiService);

  ngOnInit() {
    this.loadData();
  }
}
