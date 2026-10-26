import { Component, inject, signal, OnInit, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { DashboardApiService } from '@cthub-bsaas/features/dashboard/services/dashboard-api.service';

@Component({
  selector: 'app-customer-stats',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule, MatFormFieldModule, MatError],
  templateUrl: './customer-stats.component.html',
  styleUrls: ['./customer-stats.component.css'],
})
export class CustomerStatsComponent implements OnInit {
  tenantId = input('');
  active = signal(0);
  passive = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(DashboardApiService);

  ngOnInit() {
    if (!this.tenantId()) return;
    this.loading.set(true);
    this.api.getUserStats(this.tenantId).subscribe({
      next: (res) => {
        this.active.set(res.activeCustomer);
        this.passive.set(res.customerCount - res.activeCustomer);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err.message || $localize`:@@DASHBOARD.CUSTOMER_STATS.ERROR_LOADING:Failed to load customer stats`);
        this.loading.set(false);
      },
    });
  }
}
