import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductParams, CreateProductParams, UpdateProductParams } from '../../models/product-params.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/product';

  constructor(private http: HttpClient) {}

  saveProduct(data: ProductParams): Observable<{ success: boolean }> {
    const payload: ProductParams = {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      images: data.images,
      categories: data.categories,
      tags: data.tags,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      quantity: data.quantity,
      trackQuantity: data.trackQuantity,
    };
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/save`, this.mapToSnakeCase(payload))
      .pipe(catchError((err) => this.handleError(err)));
  }

  createProduct(params: CreateProductParams): Observable<any> {
    const payload: CreateProductParams = {
      name: params.name,
      description: params.description,
      price: params.price,
      images: params.images,
      categories: params.categories,
      tags: params.tags,
      isActive: params.isActive,
      isFeatured: params.isFeatured,
      quantity: params.quantity,
      trackQuantity: params.trackQuantity,
      salonId: params.salonId,
      createdBy: params.createdBy,
    };
    return this.http.post(`${this.apiUrl}/products`, this.mapToSnakeCase(payload)).pipe(catchError((err) => this.handleError(err)));
  }

  updateProduct(params: UpdateProductParams): Observable<any> {
    const payload: UpdateProductParams = {
      id: params.id,
      name: params.name,
      description: params.description,
      price: params.price,
      images: params.images,
      categories: params.categories,
      tags: params.tags,
      isActive: params.isActive,
      isFeatured: params.isFeatured,
      quantity: params.quantity,
      trackQuantity: params.trackQuantity,
      updatedBy: params.updatedBy,
    };
    return this.http
      .put(`${this.apiUrl}/products/${params.id}`, this.mapToSnakeCase(payload))
      .pipe(catchError((err) => this.handleError(err)));
  }

  private mapToSnakeCase(obj: any): any {
    const snakeCaseObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        snakeCaseObj[this.toSnakeCase(key)] = obj[key];
      }
    }
    return snakeCaseObj;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private handleError(err: any) {
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Product not found.';
    } else if (err.status === 401) {
      userMessage = 'You are not authorized. Please log in again.';
    } else if (err.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (err.status === 400) {
      userMessage = err.error?.error || 'Bad request.';
    } else if (err.error?.error) {
      userMessage = err.error.error;
    }
    return throwError(() => ({ ...err, userMessage }));
  }
}
