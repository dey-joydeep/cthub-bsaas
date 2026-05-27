import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Salon, SalonServiceItem } from './model/salon-search.model';
import { PublicDiscoveryApi } from '../../public-discovery/public-discovery.api';
import type { PublicPage, PublicSalonSummary, PublicService } from '../../public-discovery/public-discovery.models';

@Injectable({ providedIn: 'root' })
export class SalonSearchService {
  constructor(private readonly publicDiscovery: PublicDiscoveryApi) {}

  searchSalons(params: HttpParams): Observable<{ salons: Salon[]; total: number }> {
    return this.publicDiscovery
      .searchSalons({
        q: params.get('q') ?? params.get('name') ?? undefined,
        city: params.get('city') ?? undefined,
        serviceId: params.get('serviceId') ?? undefined,
        ratingMin: params.get('ratingMin') ? Number(params.get('ratingMin')) : null,
        limit: Number(params.get('limit') ?? params.get('page_size') ?? 20),
      })
      .pipe(
        map((page) => ({ salons: page.items.map((salon) => this.mapSalon(salon)), total: this.estimatedTotal(page) })),
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

  private estimatedTotal<T>(page: PublicPage<T>): number {
    return page.items.length + (page.page.hasMore ? 1 : 0);
  }
}
