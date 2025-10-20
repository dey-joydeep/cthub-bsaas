import { Component, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';
import { RevenueData } from '../../models/dashboard.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss'],
})
export class RevenueChartComponent extends AbstractBaseComponent {
  @Input() revenueData!: RevenueData[];

  constructor(@Inject(ErrorService) protected override errorService: ErrorService) {
    super(errorService);
  }

  override ngOnInit(): void {
    // No additional initialization needed
  }
}
