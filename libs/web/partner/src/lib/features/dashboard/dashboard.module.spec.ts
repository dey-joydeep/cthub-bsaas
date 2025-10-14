import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DashboardModule } from './dashboard.module';
import { DashboardComponent } from './dashboard.component';
import { ProductSalesWidgetComponent } from './widgets/product-sales-widget/product-sales-widget.component';
import { DashboardService } from './services/dashboard.service';

describe('DashboardModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      declarations: [DashboardComponent, ProductSalesWidgetComponent],
      providers: [DashboardService, { provide: TranslateService, useValue: { instant: (key: string) => key } }],
    }).compileComponents();
  });

  it('should create the dashboard module', () => {
    const module = new DashboardModule();
    expect(module).toBeTruthy();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should create the product sales widget component', () => {
    const fixture = TestBed.createComponent(ProductSalesWidgetComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have the dashboard service available', () => {
    const service = TestBed.inject(DashboardService);
    expect(service).toBeTruthy();
  });

  it('should have the translate service available', () => {
    const service = TestBed.inject(TranslateService);
    expect(service).toBeTruthy();
  });
});
