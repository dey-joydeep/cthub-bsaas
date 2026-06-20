import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { PARTNER_API_BASE_URL } from '@cthub-bsaas/web-core-http';

import {
  BranchHours,
  BranchHolidayInput,
  BranchPolicy,
  BranchPolicyInput,
  BranchProfile,
  BranchProfileInput,
  PagedEnvelope,
  ResponseEnvelope,
  SalonBusiness,
  SalonBusinessInput,
  WeeklyHoursInput,
} from './models/salon-owner-settings.models';

@Injectable({ providedIn: 'root' })
export class SalonOwnerSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl: string = inject(PARTNER_API_BASE_URL);
  private readonly branchPageSize = 100;

  listBusinesses(): Observable<PagedEnvelope<SalonBusiness>> {
    return this.getPaged<SalonBusiness>('/businesses');
  }

  createBusiness(input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.post('/businesses', input, this.createIdempotencyOptions());
  }

  updateBusiness(businessId: string, input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.patch(`/businesses/${businessId}`, input);
  }

  listBranches(businessId?: string): Observable<PagedEnvelope<BranchProfile>> {
    const baseParams = businessId ? new HttpParams().set('businessId', businessId) : new HttpParams();
    return this.getPaged<BranchProfile>('/branches', baseParams.set('page', 1).set('pageSize', this.branchPageSize)).pipe(
      expand((result) =>
        result.page.page * result.page.pageSize < result.page.total
          ? this.getPaged<BranchProfile>(
              '/branches',
              baseParams.set('page', result.page.page + 1).set('pageSize', this.branchPageSize),
            )
          : EMPTY,
      ),
      reduce(
        (combined, page) => ({
          items: [...combined.items, ...page.items],
          page: page.page,
        }),
        {
          items: [] as BranchProfile[],
          page: {
            page: 1,
            pageSize: this.branchPageSize,
            total: 0,
          },
        } satisfies PagedEnvelope<BranchProfile>,
      ),
    );
  }

  createBranch(input: BranchProfileInput): Observable<BranchProfile> {
    return this.post('/branches', input, this.createIdempotencyOptions());
  }

  updateBranch(branchId: string, input: BranchProfileInput): Observable<BranchProfile> {
    return this.patch(`/branches/${branchId}`, input);
  }

  getBranchHours(branchId: string): Observable<BranchHours> {
    return this.get(`/branches/${branchId}/hours`);
  }

  replaceBranchHours(branchId: string, input: WeeklyHoursInput): Observable<BranchHours> {
    return this.put(`/branches/${branchId}/hours`, input);
  }

  setBranchHoliday(branchId: string, date: string, input: BranchHolidayInput): Observable<BranchHolidayInput> {
    return this.put(`/branches/${branchId}/holidays/${date}`, input);
  }

  getBranchPolicy(branchId: string): Observable<BranchPolicy> {
    return this.get(`/branches/${branchId}/policy`);
  }

  updateBranchPolicy(branchId: string, input: BranchPolicyInput): Observable<BranchPolicy> {
    return this.put(`/branches/${branchId}/policy`, input);
  }

  private get<T>(path: string, options?: { params?: HttpParams }): Observable<T> {
    return this.http
      .get<ResponseEnvelope<T>>(`${this.baseUrl}${path}`, this.withCredentials(options))
      .pipe(map((response) => response.data));
  }

  private getPaged<T>(path: string, params?: HttpParams): Observable<PagedEnvelope<T>> {
    return this.http
      .get<ResponseEnvelope<{ items: readonly T[] }>>(`${this.baseUrl}${path}`, this.withCredentials({ params }))
      .pipe(
        map((response) => ({
          items: response.data.items,
          page: {
            page: response.meta?.page ?? 1,
            pageSize: response.meta?.pageSize ?? response.data.items.length,
            total: response.meta?.total ?? response.data.items.length,
          },
        })),
      );
  }

  private post<T>(path: string, body: unknown, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .post<ResponseEnvelope<T>>(`${this.baseUrl}${path}`, body, this.withCredentials(options))
      .pipe(map((response) => response.data));
  }

  private patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ResponseEnvelope<T>>(`${this.baseUrl}${path}`, body, this.withCredentials())
      .pipe(map((response) => response.data));
  }

  private put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ResponseEnvelope<T>>(`${this.baseUrl}${path}`, body, this.withCredentials())
      .pipe(map((response) => response.data));
  }

  private withCredentials(options?: { headers?: HttpHeaders; params?: HttpParams }): {
    headers?: HttpHeaders;
    params?: HttpParams;
    withCredentials: true;
  } {
    return {
      ...options,
      withCredentials: true,
    };
  }

  private createIdempotencyOptions(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Idempotency-Key': this.createIdempotencyKey(),
      }),
    };
  }

  private createIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `partner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
