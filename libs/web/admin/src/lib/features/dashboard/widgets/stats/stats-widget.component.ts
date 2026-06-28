import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import type { DashboardStats } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslatePipe, TranslateDirective],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.css'],
})
export class StatsWidgetComponent extends AbstractBaseComponent {
  @Input() stats!: DashboardStats;

  public override ngOnInit(): void {
    // No additional initialization needed
  }
}
