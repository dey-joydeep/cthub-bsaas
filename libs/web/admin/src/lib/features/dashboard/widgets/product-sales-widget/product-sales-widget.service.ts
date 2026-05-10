import { Injectable } from '@angular/core';
import { ProductSale } from './models/product-sales-widget.model';

@Injectable({ providedIn: 'root' })
export class ProductSalesWidgetService {
  getProductSales(_params: string): Promise<ProductSale[]> {
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
