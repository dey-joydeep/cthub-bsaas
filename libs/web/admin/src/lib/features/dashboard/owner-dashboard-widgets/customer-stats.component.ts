import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { DashboardApiService } from '@cthub-bsaas/features/dashboard/services/dashboard-api.service';

@Component({
  selector: 'app-customer-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatFormFieldModule, MatError],
  templateUrl: './customer-stats.component.html',
  styleUrls: ['./customer-stats.component.scss'],
})
export class CustomerStatsComponent implements OnInit {
  @Input() tenantId = '';
  active = signal(0);
  passive = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(DashboardApiService);

  ngOnInit() {
    if (!this.tenantId) return;
    this.loading.set(true);
    this.api.getUserStats(this.tenantId).subscribe({
      next: (res) => {
        this.active.set(res.activeCustomer);
        this.passive.set(res.customerCount - res.activeCustomer);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load customer stats');
        this.loading.set(false);
      },
    });
  }
}
