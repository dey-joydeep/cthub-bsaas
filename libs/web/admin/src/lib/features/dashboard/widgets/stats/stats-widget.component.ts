import { Component, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';
import type { DashboardStats } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.scss'],
})
export class StatsWidgetComponent extends AbstractBaseComponent {
  @Input() stats!: DashboardStats;

  constructor(@Inject(ErrorService) protected override errorService: ErrorService) {
    super(errorService);
  }

  public override ngOnInit(): void {
    // No additional initialization needed
  }
}
