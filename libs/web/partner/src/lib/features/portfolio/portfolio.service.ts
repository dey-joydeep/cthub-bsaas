import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PortfolioItem } from './models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private apiUrl = '/api/portfolio';
  private readonly http = inject(HttpClient);

  getPortfolioItems(tenantId: string): Observable<PortfolioItem[]> {
    return this.http.get<PortfolioItem[]>(`${this.apiUrl}?tenant_id=${tenantId}`);
  }

  createPortfolioItem(params: FormData): Observable<PortfolioItem> {
    return this.http.post<PortfolioItem>(this.apiUrl, params);
  }

  updatePortfolioItem(id: string, params: FormData): Observable<PortfolioItem> {
    return this.http.put<PortfolioItem>(`${this.apiUrl}/${id}`, params);
  }

  deletePortfolioItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPortfolioImage(id: string): string {
    return `${this.apiUrl}/${id}/image`;
  }
}
