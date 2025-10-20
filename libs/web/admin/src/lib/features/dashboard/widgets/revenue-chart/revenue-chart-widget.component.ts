import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../dashboard/dashboard.service';
import { RevenueData } from '../../../dashboard/models/dashboard.model';
import { ErrorService } from '@cthub-bsaas/web-core/http';

@Component({
  selector: 'app-revenue-chart-widget',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './revenue-chart-widget.component.html',
  styleUrls: ['./revenue-chart-widget.component.scss'],
  host: { class: 'revenue-chart' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueChartWidgetComponent implements OnInit, OnDestroy {
  private dataSubscription?: Subscription;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Chart configuration
  public chartType = 'line' as const;
  public revenueData: RevenueData[] = [];
  public isLoading = true;
  public error: string | null = null;

  // Chart data with proper typing
  public chartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
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
  };

  // Chart options
  public chartOptions: ChartConfiguration['options'] = {
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
        grid: {
          display: false,
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
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
      },
    },
  };

  constructor(
    private dashboardService: DashboardService,
    protected errorService: ErrorService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.loadData();
  }

  public ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private handleDataError(error: unknown): void {
    console.error('Error in revenue chart:', error);
    this.error = error instanceof Error ? error.message : 'Failed to load revenue data';
    this.isLoading = false;
    this.changeDetectorRef.detectChanges();
  }

  private loadData(): void {
    this.isLoading = true;
    this.error = null;

    try {
      // getRevenueData() returns a Promise<RevenueData[]>
      this.dashboardService
        .getRevenueData()
        .then((revenueData: RevenueData[]) => {
          this.updateChartData(revenueData);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        })
        .catch((error: Error) => {
          this.handleDataError(error);
        });
    } catch (error) {
      this.handleDataError(error);
    }
  }

  private updateChartData(revenueData: RevenueData[]): void {
    if (!revenueData?.length) {
      this.error = 'No revenue data available';
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    try {
      // Update the chart data with the new values
      this.chartData = {
        labels: revenueData.map((item) => item.date),
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: revenueData.map((item) => item.amount),
          },
        ],
      };

      this.error = null;
      this.chart?.update();
    } catch (error) {
      console.error('Error updating chart data:', error);
      this.error = 'Failed to update chart data';
      this.changeDetectorRef.detectChanges();
    }
  }

  // Refresh chart data
  public refreshChart(): void {
    this.error = null;
    this.loadData();
  }
}
