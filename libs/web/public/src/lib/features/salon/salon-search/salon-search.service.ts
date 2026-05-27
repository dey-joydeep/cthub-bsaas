import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Salon, SalonServiceItem } from './model/salon-search.model';
import { PublicDiscoveryApi } from '../../public-discovery/public-discovery.api';
import type { PublicPage, PublicSalonSummary, PublicService } from '../../public-discovery/public-discovery.models';

@Injectable({ providedIn: 'root' })
export class SalonSearchService {
  private readonly cursors = new Map<string, string>();

  constructor(private readonly publicDiscovery: PublicDiscoveryApi) {}

  searchSalons(params: HttpParams): Observable<{ salons: Salon[]; total: number }> {
    const limit = Number(params.get('limit') ?? params.get('page_size') ?? 20);
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const key = this.searchKey(params, limit);
    const cursor = page > 1 ? this.cursors.get(`${key}:${page}`) : undefined;
    return this.publicDiscovery
      .searchSalons({
        q: params.get('q') ?? params.get('name') ?? undefined,
        city: params.get('city') ?? undefined,
        serviceId: params.get('serviceId') ?? undefined,
        ratingMin: params.get('ratingMin') ? Number(params.get('ratingMin')) : null,
        limit,
        cursor,
      })
      .pipe(
        map((result) => {
          if (result.page.nextCursor) {
            this.cursors.set(`${key}:${page + 1}`, result.page.nextCursor);
          }
          return {
            salons: result.items.map((salon) => this.mapSalon(salon)),
            total: this.estimatedTotal(result, page, limit),
          };
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  getServices(): Observable<SalonServiceItem[]> {
    return this.publicDiscovery.getHome().pipe(
      map((home) => home.popularServices.map((service) => this.mapService(service))),
      catchError((err) => this.handleError(err)),
    );
  }

  private handleError(error: any) {
    let userMessage = 'An unknown error occurred.';
    if (error.status === 0) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'Bad request.';
    } else if (error.status === 401) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'Requested resource not found.';
    } else if (error.status >= 500) {
      userMessage = 'A server error occurred. Please try again later.';
    }
    return throwError(() => ({ ...error, userMessage }));
  }

  private mapSalon(salon: PublicSalonSummary): Salon {
    return {
      id: salon.slug,
      name: salon.name,
      address: salon.area ?? '',
      city: salon.area ?? '',
      latitude: 0,
      longitude: 0,
      services: [],
      staff: [],
      ownerId: '',
      rating: Number(salon.rating),
      averageRating: Number(salon.rating),
      reviewCount: salon.reviewCount,
    };
  }

  private mapService(service: PublicService): SalonServiceItem {
    return {
      id: service.serviceId,
      name: service.name,
      price: Number(service.priceFrom),
      duration: service.durationMinutes,
    };
  }

  private searchKey(params: HttpParams, limit: number): string {
    return JSON.stringify({
      q: params.get('q') ?? params.get('name') ?? null,
      city: params.get('city') ?? null,
      serviceId: params.get('serviceId') ?? null,
      ratingMin: params.get('ratingMin') ?? null,
      sort: params.get('sort') ?? null,
      limit,
    });
  }

  private estimatedTotal<T>(page: PublicPage<T>, pageNumber: number, limit: number): number {
    return (pageNumber - 1) * limit + page.items.length + (page.page.hasMore ? 1 : 0);
  }
}
