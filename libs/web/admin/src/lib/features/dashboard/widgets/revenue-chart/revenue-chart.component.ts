import { Component, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { RevenueData } from '../../models/dashboard.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.css'],
})
export class RevenueChartComponent extends AbstractBaseComponent {
  revenueData = input<RevenueData[]>([]);
}
