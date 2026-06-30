import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import type { DashboardStats } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.css'],
})
export class StatsWidgetComponent extends AbstractBaseComponent {
  stats = input.required<DashboardStats>();

  public override ngOnInit(): void {
    // No additional initialization needed
  }
}
