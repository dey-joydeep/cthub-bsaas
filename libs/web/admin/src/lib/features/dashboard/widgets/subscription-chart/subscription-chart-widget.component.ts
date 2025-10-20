import { Component, Input, OnChanges, SimpleChanges, ViewChild, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, from, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';
import { SubscriptionData } from '../../models/dashboard.model';
import { DashboardService } from '../../dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-subscription-chart-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    BaseChartDirective,
  ],
  templateUrl: './subscription-chart-widget.component.html',
  styleUrls: ['./subscription-chart-widget.component.scss'],
})
export class SubscriptionChartWidgetComponent extends AbstractBaseComponent implements OnChanges {
  @Input() subscriptionData: SubscriptionData[] = [];
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  // Chart configuration
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Customer Retention Rate',
        borderColor: 'var(--mat-primary)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'var(--mat-primary)',
        pointBorderColor: 'var(--mat-primary)',
        pointHoverBackgroundColor: 'var(--mat-primary)',
        pointHoverBorderColor: 'var(--mat-primary)',
        borderWidth: 2,
      },
    ],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--bsaas-text-primary)',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const rate = context.raw as number;
            return `${rate.toFixed(1)}%`;
          },
        },
        backgroundColor: 'var(--mat-primary)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(13, 110, 253, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}%`,
          color: 'var(--bsaas-text-secondary)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          color: 'var(--bsaas-text-secondary)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  private dashboardService = inject(DashboardService);

  constructor(@Inject(ErrorService) protected override errorService: ErrorService) {
    super(errorService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subscriptionData'] && this.subscriptionData?.length) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (!this.subscriptionData?.length) return;

    const chartData = this.subscriptionData.map((data) => ({
      month: new Date(data.month).toLocaleDateString('en-US', { month: 'short' }),
      retentionRate: data.retentionRate,
    }));

    this.lineChartData = {
      ...this.lineChartData,
      labels: chartData.map((data) => data.month),
      datasets: [
        {
          ...this.lineChartData.datasets[0],
          data: chartData.map((data) => data.retentionRate),
        },
      ],
    };

    // Force update the chart
    if (this.chart) {
      this.chart.update();
    }
  }

  /**
   * Load subscription data from the dashboard service
   * Handles both Promise and Observable return types
   * @returns Observable that emits when data is loaded
   */
  public loadData(): Observable<SubscriptionData[]> {
    this.loading = true;
    const data = this.dashboardService.getSubscriptionData();

    // Handle both Promise and Observable return types
    const data$ = data instanceof Promise ? from(data) : data;

    return data$.pipe(
      tap((data: SubscriptionData[]) => {
        this.subscriptionData = data;
        this.updateChartData();
        this.error = null;
        this.loading = false;
      }),
      catchError((error: Error) => {
        this.error = 'Failed to load subscription data';
        this.loading = false;
        console.error('Error loading subscription data:', error);
        return of([]); // Return empty array on error
      }),
    );
  }

  /**
   * Refresh the chart data
   */
  public refreshChart(): void {
    this.loadData().subscribe({
      next: () => {
        // Data loaded successfully
      },
      error: (error: Error) => {
        console.error('Error in refreshChart:', error);
      },
    });
  }
}
