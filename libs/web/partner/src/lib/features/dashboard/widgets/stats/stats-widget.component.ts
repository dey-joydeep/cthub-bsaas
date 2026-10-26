import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import type { DashboardStats } from './models/stats-widget.model';

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [CurrencyPipe, MatCardModule, MatIconModule],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.css'],
})
export class StatsWidgetComponent extends AbstractBaseComponent {
  stats = input<DashboardStats>({
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });

  // No extra constructor logic required; base class handles error service injection.
}
