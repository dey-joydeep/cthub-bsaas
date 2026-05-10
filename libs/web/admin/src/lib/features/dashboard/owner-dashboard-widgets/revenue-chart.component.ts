import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardApiService, RevenueData } from '@cthub-bsaas/features/dashboard/services/dashboard-api.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    MatCardModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatError,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss'],
})
export class RevenueChartComponent implements OnInit {
  @Input() tenantId = '';
  private snackBar = inject(MatSnackBar);
  private dashboardService = inject(DashboardApiService);

  // Chart configuration
  chartType = 'line' as const; // Explicitly type as 'line' literal
  loading = signal(false);
  chartError = signal<string | null>(null);

  // Chart data with proper typing
  chartData = signal<ChartData<'line', number[], string>>({
    labels: [],
    datasets: [
      {
        label: 'Revenue',
        data: [],
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        pointBackgroundColor: '#3f51b5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3f51b5',
        fill: true,
        tension: 0.4,
      },
    ],
  });

  // Chart options with proper typing
  options: ChartOptions<'line'> = {
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
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value?.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  // Initialize component and load data
  ngOnInit(): void {
    this.loadRevenueData();
  }

  // Load revenue data from API
  loadRevenueData(): void {
    if (!this.tenantId) {
      this.chartError.set('Tenant ID is required');
      return;
    }

    this.loading.set(true);
    this.chartError.set(null);

    this.dashboardService.getRevenue(this.tenantId).subscribe({
      next: (revenueData: RevenueData) => {
        // Update chart data with the API response
        this.chartData.set({
          labels: revenueData.labels || [],
          datasets:
            revenueData.datasets?.length > 0
              ? revenueData.datasets
              : [
                  {
                    ...this.chartData().datasets[0],
                    data: [],
                  },
                ],
        });
        this.loading.set(false);
      },
      error: (err: Error) => {
        const errorMessage = err?.message || 'Failed to load revenue data';
        this.chartError.set(errorMessage);
        this.loading.set(false);
        this.showError(errorMessage);
      },
    });
  }

  // Export chart data
  exportData(): void {
    const data = this.chartData();
    // In a real implementation, this would export to CSV/Excel
    console.log('Exporting revenue data:', data);
    this.showSuccess('Export started');
  }

  // Show success message
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  // Show error message
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  // Using dashboardService injected in the constructor
}
