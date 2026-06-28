import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { RevenueData } from './models/revenue-chart.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, TranslatePipe, TranslateDirective],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.css'],
})
export class RevenueChartComponent extends AbstractBaseComponent {
  @Input() revenueData!: RevenueData[];

  override ngOnInit(): void {
    // No additional initialization needed
  }
}
