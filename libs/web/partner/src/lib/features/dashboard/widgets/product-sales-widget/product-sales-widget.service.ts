import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductSale } from './models/product-sales-widget.model';

@Injectable({ providedIn: 'root' })
export class ProductSalesWidgetService {
  constructor(public http: HttpClient) {}

  getProductSales(params?: string): Promise<ProductSale[]> {
    void this.http;
    void params;
    // Simulate API call
    return Promise.resolve([
      {
        productName: 'Shampoo',
        quantity: 10,
        unitPrice: 15,
        totalAmount: 150,
        saleDate: new Date().toISOString(),
        soldBy: 'Staff A',
      },
      {
        productName: 'Conditioner',
        quantity: 5,
        unitPrice: 20,
        totalAmount: 100,
        saleDate: new Date().toISOString(),
        soldBy: 'Staff B',
      },
    ]);
  }
}
