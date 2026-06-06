import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type {
  ApiEnvelope,
  PublicHome,
  PublicPage,
  PublicReview,
  PublicSalonProfile,
  PublicSalonSummary,
  PublicService,
} from './public-discovery.models';

@Injectable({ providedIn: 'root' })
export class PublicDiscoveryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/public';

  getHome(city?: string, area?: string): Observable<PublicHome> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    if (area) {
      params = params.set('area', area);
    }
    return this.http.get<ApiEnvelope<PublicHome>>(`${this.baseUrl}/home`, { params }).pipe(map((response) => response.data));
  }

  searchSalons(options: PublicSalonSearchOptions): Observable<PublicPage<PublicSalonSummary>> {
    let params = new HttpParams().set('limit', options.limit ?? 20);
    if (options.q) {
      params = params.set('q', options.q);
    }
    if (options.city) {
      params = params.set('city', options.city);
    }
    if (options.serviceId) {
      params = params.set('serviceId', options.serviceId);
    }
    if (options.ratingMin !== null && options.ratingMin !== undefined) {
      params = params.set('ratingMin', options.ratingMin);
    }
    if (options.cursor) {
      params = params.set('cursor', options.cursor);
    }
    return this.http
      .get<ApiEnvelope<PublicPage<PublicSalonSummary>>>(`${this.baseUrl}/salons`, { params })
      .pipe(map((response) => response.data));
  }

  getSalonProfile(slug: string): Observable<PublicSalonProfile> {
    return this.http.get<ApiEnvelope<PublicSalonProfile>>(`${this.baseUrl}/salons/${slug}`).pipe(map((response) => response.data));
  }

  listSalonServices(slug: string): Observable<PublicPage<PublicService>> {
    return this.http
      .get<ApiEnvelope<PublicPage<PublicService>>>(`${this.baseUrl}/salons/${slug}/services`)
      .pipe(map((response) => response.data));
  }

  listSalonReviews(slug: string): Observable<PublicPage<PublicReview>> {
    return this.http
      .get<ApiEnvelope<PublicPage<PublicReview>>>(`${this.baseUrl}/salons/${slug}/reviews`)
      .pipe(map((response) => response.data));
  }
}

export interface PublicSalonSearchOptions {
  readonly q?: string;
  readonly city?: string;
  readonly serviceId?: string;
  readonly ratingMin?: number | null;
  readonly limit?: number;
  readonly cursor?: string;
}
