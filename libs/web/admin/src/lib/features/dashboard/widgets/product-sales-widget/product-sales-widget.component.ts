import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs';

import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { ProductSalesWidgetService } from './product-sales-widget.service';
import { ProductSale } from './models/product-sales-widget.model';

@Component({
  selector: 'app-product-sales-widget',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    RouterModule,
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
  ],
  templateUrl: './product-sales-widget.component.html',
  styleUrls: ['./product-sales-widget.component.css'],
})
export class ProductSalesWidgetComponent extends AbstractBaseComponent implements OnInit {
  // Loading and error states are managed by AbstractBaseComponent

  // Table data
  displayedColumns: string[] = ['productName', 'quantity', 'unitPrice', 'totalAmount', 'saleDate', 'soldBy'];
  dataSource: ProductSale[] = [];
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  sortField = 'saleDate';
  sortDirection: 'asc' | 'desc' | undefined = 'desc';
  private readonly productSalesWidgetService = inject(ProductSalesWidgetService);
  // Date range filter
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Summary data
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalItems: number;
    averageSale: number;
    topSellingProducts: Array<{ name: string; quantity: number }>;
  } | null = null;

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadData();
    this.loadSummary();

    // Subscribe to date range changes
    this.dateRange.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.loadData();
      this.loadSummary();
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  loadData(): void {
    this.loading = true;
    const { start, end } = this.dateRange.value;
    const tenantId = 'default-tenant'; // TODO: Get tenant ID from auth service or config

    // Convert date range to query params
    const params = new URLSearchParams();
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    params.set('page', (this.pageIndex + 1).toString());
    params.set('pageSize', this.pageSize.toString());
    params.set('sortField', this.sortField);
    if (this.sortDirection) {
      params.set('sortDirection', this.sortDirection);
    }

    // Call the service with the tenant ID and query params
    this.productSalesWidgetService
      .getProductSales(tenantId + '?' + params.toString())
      .then((data: ProductSale[]) => {
        this.dataSource = Array.isArray(data) ? data : [];
        this.totalItems = Array.isArray(data) ? data.length : 0;
        this.loading = false;
      })
      .catch((err: any) => {
        console.error('Error loading product sales:', err);
        this.handleError(err);
        const errorMessage = $localize`:@@DASHBOARD.PRODUCT_SALES.ERROR_LOADING:Failed to load product sales.`;
        this.errorService.handleError(new Error(errorMessage));
        this.loading = false;
      });
  }

  loadSummary(): void {
    const { start, end } = this.dateRange.value;
    const tenantId = 'default-tenant'; // TODO: Get tenant ID from auth service or config

    // Convert date range to query params
    const params = new URLSearchParams();
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    params.set('page', '1');
    params.set('pageSize', '5');
    params.set('sortField', 'quantity');
    params.set('sortDirection', 'desc');

    // Call the service with the tenant ID and query params
    this.productSalesWidgetService
      .getProductSales(tenantId + '?' + params.toString())
      .then((items: ProductSale[]) => {
        const validItems = Array.isArray(items) ? items : [];
        const totalRevenue = validItems.reduce((sum: number, item: ProductSale) => sum + (item.totalAmount || 0), 0);
        const totalItems = validItems.reduce((sum: number, item: ProductSale) => sum + (item.quantity || 0), 0);

        this.summary = {
          totalSales: validItems.length,
          totalRevenue,
          totalItems,
          averageSale: validItems.length > 0 ? totalRevenue / validItems.length : 0,
          topSellingProducts: validItems.slice(0, 5).map((item: ProductSale) => ({
            name: item.productName || 'Unknown',
            quantity: item.quantity || 0,
          })),
        };
      })
      .catch((err: any) => {
        console.error('Error loading product sales summary:', err);
        this.handleError(err);
      });
  }

  onPageChange(event: PageEvent): void {
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      this.loadData();
    }
  }

  onSortChange(sort: Sort): void {
    if (sort && sort.active) {
      this.sortField = sort.active;
      this.sortDirection = sort.direction === '' ? undefined : sort.direction;
      this.loadData();
    }
  }

  onDateRangeSelected(range: { start: Date | null; end: Date | null }): void {
    if (range) {
      this.dateRange.patchValue({
        start: range.start,
        end: range.end,
      });
    }
  }

  refresh(): void {
    this.loadData();
    this.loadSummary();
  }

  exportToCSV(): void {
    // TODO: Implement CSV export functionality
    console.log('Exporting to CSV...');
  }
}
