import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '@env/environment';

import { DashboardService } from './dashboard.service';
import { ProductSalesFilter } from '../models/dashboard.model';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProductSales', () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          productId: 'p1',
          productName: 'Test Product',
          quantity: 2,
          unitPrice: 25,
          totalAmount: 50,
          saleDate: '2023-01-01T00:00:00.000Z',
          soldBy: 'u1',
          customerName: 'Test User',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    it('should fetch product sales with default parameters', () => {
      const filters: ProductSalesFilter = {};

      service.getProductSales(filters).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].productName).toBe('Test Product');
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/product-sales?page=1&pageSize=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should apply filters when provided', () => {
      const filters: ProductSalesFilter = {
        page: 2,
        pageSize: 5,
        sortField: 'saleDate',
        sortDirection: 'desc',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        productId: 'p1',
        soldById: 'u1',
      };

      service.getProductSales(filters).subscribe();

      const req = httpMock.expectOne(
        (req) =>
          req.url === `${apiUrl}/dashboard/product-sales` &&
          req.params.get('page') === '2' &&
          req.params.get('pageSize') === '5' &&
          req.params.get('sortBy') === 'saleDate' &&
          req.params.get('sortOrder') === 'DESC' &&
          req.params.get('startDate') === '2023-01-01' &&
          req.params.get('endDate') === '2023-12-31' &&
          req.params.get('productId') === 'p1' &&
          req.params.get('soldById') === 'u1',
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getProductSalesSummary', () => {
    const mockSummary = {
      totalSales: 10,
      totalRevenue: 1000,
      totalItemsSold: 50,
      averageSaleValue: 100,
      salesByProduct: [
        { productId: 'p1', productName: 'Product 1', quantity: 20, revenue: 500 },
        { productId: 'p2', productName: 'Product 2', quantity: 30, revenue: 500 },
      ],
      salesByDate: [
        { date: '2023-01-01', sales: 500, items: 25 },
        { date: '2023-01-02', sales: 500, items: 25 },
      ],
    };

    it('should fetch product sales summary', () => {
      service.getProductSalesSummary({}).subscribe((summary) => {
        expect(summary.totalSales).toBe(10);
        expect(summary.totalRevenue).toBe(1000);
        expect(summary.salesByProduct.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/product-sales/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });

    it('should apply date range filters when provided', () => {
      const filters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      service.getProductSalesSummary(filters).subscribe();

      const req = httpMock.expectOne(
        (req) =>
          req.url === `${apiUrl}/dashboard/product-sales/summary` &&
          req.params.get('startDate') === '2023-01-01' &&
          req.params.get('endDate') === '2023-12-31',
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });
  });

  describe('getTopSellingProducts', () => {
    const mockTopProducts = [
      { productId: 'p1', productName: 'Product 1', quantity: 20, revenue: 500 },
      { productId: 'p2', productName: 'Product 2', quantity: 15, revenue: 400 },
    ];

    it('should fetch top selling products with default limit', () => {
      service.getTopSellingProducts().subscribe((products) => {
        expect(products.length).toBe(2);
        expect(products[0].productName).toBe('Product 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/product-sales/top-selling?limit=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopProducts);
    });

    it('should apply custom limit when provided', () => {
      service.getTopSellingProducts(10).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/dashboard/product-sales/top-selling?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTopProducts);
    });
  });
});
