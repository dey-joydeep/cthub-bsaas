import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductSalesWidgetComponent } from './product-sales-widget.component';
import { ProductSalesWidgetService } from './product-sales-widget.service';
import { ProductSale } from './models/product-sales-widget.model';

const mockProductSales: ProductSale[] = [
  {
    productName: 'Shampoo',
    quantity: 10,
    unitPrice: 15,
    totalAmount: 150,
    saleDate: '2023-01-01T00:00:00.000Z',
    soldBy: 'Staff A',
  },
  {
    productName: 'Conditioner',
    quantity: 5,
    unitPrice: 20,
    totalAmount: 100,
    saleDate: '2023-01-02T00:00:00.000Z',
    soldBy: 'Staff B',
  },
];

describe('ProductSalesWidgetComponent', () => {
  let component: ProductSalesWidgetComponent;
  let fixture: ComponentFixture<ProductSalesWidgetComponent>;
  let productSalesWidgetService: { getProductSales: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productSalesWidgetService = {
      getProductSales: vi.fn().mockResolvedValue(mockProductSales),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductSalesWidgetComponent,
        NoopAnimationsModule,
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
      ],
      providers: [{ provide: ProductSalesWidgetService, useValue: productSalesWidgetService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductSalesWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product sales and summary on init', async () => {
    await fixture.whenStable();
    expect(productSalesWidgetService.getProductSales).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(2);
    expect(component.summary).toBeTruthy();
  });

  it('should display loading state while fetching data', () => {
    component.loading = true;
    component.dataSource = [];
    fixture.detectChanges();
    const loadingElement = fixture.nativeElement.querySelector('mat-spinner');
    expect(loadingElement).toBeTruthy();
  });

  it('should handle error when loading product sales', fakeAsync(() => {
    productSalesWidgetService.getProductSales.mockRejectedValueOnce(new Error('Error loading product sales'));
    component.loadData();
    tick();
    fixture.detectChanges();
    expect(component.loading).toBe(false);
  }));

  it('should update table when page changes', () => {
    const pageEvent = new PageEvent();
    pageEvent.pageIndex = 1;
    pageEvent.pageSize = 20;

    component.onPageChange(pageEvent);

    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(productSalesWidgetService.getProductSales).toHaveBeenCalled();
  });

  it('should update table when sort changes', () => {
    const sortEvent: Sort = {
      active: 'productName',
      direction: 'asc',
    };

    component.onSortChange(sortEvent);

    expect(component.sortField).toBe('productName');
    expect(component.sortDirection).toBe('asc');
    expect(productSalesWidgetService.getProductSales).toHaveBeenCalled();
  });

  it('should refresh data when refresh is called', () => {
    productSalesWidgetService.getProductSales.mockClear();
    component.refresh();
    expect(productSalesWidgetService.getProductSales).toHaveBeenCalledTimes(2);
  });

  it('should display summary cards with correct data', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.summary?.totalRevenue).toBe(250);
    expect(component.summary?.totalItems).toBe(15);
  });
});
