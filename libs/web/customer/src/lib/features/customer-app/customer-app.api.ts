import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type {
  ApiListEnvelope,
  ApiObjectEnvelope,
  CustomerAppointment,
  CustomerBooking,
  CustomerBookingContext,
  CustomerBookingContextQuery,
  CustomerBookingInput,
  CustomerCancelInput,
  CustomerCancelResult,
  CustomerDashboard,
  CustomerFavorite,
  CustomerFavoriteMutation,
  CustomerPage,
  CustomerReceipt,
  CustomerRescheduleInput,
  CustomerReviewInput,
  CustomerReviewSubmission,
  CustomerReward,
} from './customer-app.models';

@Injectable({ providedIn: 'root' })
export class CustomerAppApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/customer';

  getDashboard(): Observable<CustomerDashboard> {
    return this.http.get<ApiObjectEnvelope<CustomerDashboard>>(`${this.baseUrl}/dashboard`).pipe(map((response) => response.data));
  }

  getBookingContext(query: CustomerBookingContextQuery = {}): Observable<CustomerBookingContext> {
    let params = new HttpParams();
    if (query.businessId) {
      params = params.set('businessId', query.businessId);
    }
    if (query.branchId) {
      params = params.set('branchId', query.branchId);
    }
    if (query.serviceId) {
      params = params.set('serviceId', query.serviceId);
    }
    return this.http
      .get<ApiObjectEnvelope<CustomerBookingContext>>(`${this.baseUrl}/booking/context`, { params })
      .pipe(map((response) => response.data));
  }

  createBooking(input: CustomerBookingInput, idempotencyKey = crypto.randomUUID()): Observable<CustomerBooking> {
    return this.http
      .post<ApiObjectEnvelope<CustomerBooking>>(`${this.baseUrl}/bookings`, input, { headers: { 'Idempotency-Key': idempotencyKey } })
      .pipe(map((response) => response.data));
  }

  listAppointments(limit = 20): Observable<CustomerPage<CustomerAppointment>> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<ApiListEnvelope<CustomerAppointment>>(`${this.baseUrl}/appointments`, { params })
      .pipe(map((response) => this.toPage(response, limit)));
  }

  rescheduleAppointment(
    appointmentId: string,
    input: CustomerRescheduleInput,
    idempotencyKey = crypto.randomUUID(),
  ): Observable<CustomerAppointment> {
    return this.http
      .post<
        ApiObjectEnvelope<CustomerAppointment>
      >(`${this.baseUrl}/appointments/${appointmentId}/reschedule`, input, { headers: { 'Idempotency-Key': idempotencyKey } })
      .pipe(map((response) => response.data));
  }

  cancelAppointment(appointmentId: string, input: CustomerCancelInput): Observable<CustomerCancelResult> {
    return this.http
      .post<ApiObjectEnvelope<CustomerCancelResult>>(`${this.baseUrl}/appointments/${appointmentId}/cancel`, input)
      .pipe(map((response) => response.data));
  }

  listFavorites(targetType?: string): Observable<CustomerPage<CustomerFavorite>> {
    const params = targetType ? new HttpParams().set('targetType', targetType) : undefined;
    return this.http
      .get<ApiListEnvelope<CustomerFavorite>>(`${this.baseUrl}/favorites`, { params })
      .pipe(map((response) => this.toPage(response, 20)));
  }

  upsertFavorite(targetType: string, targetId: string, favorite: boolean): Observable<CustomerFavoriteMutation> {
    return this.http
      .put<ApiObjectEnvelope<CustomerFavoriteMutation>>(`${this.baseUrl}/favorites/${targetType}/${targetId}`, { favorite })
      .pipe(map((response) => response.data));
  }

  listRewards(businessId?: string): Observable<CustomerPage<CustomerReward>> {
    const params = businessId ? new HttpParams().set('businessId', businessId) : undefined;
    return this.http
      .get<ApiListEnvelope<CustomerReward>>(`${this.baseUrl}/rewards`, { params })
      .pipe(map((response) => this.toPage(response, 20)));
  }

  listReceipts(options: CustomerReceiptsQuery = {}): Observable<CustomerPage<CustomerReceipt>> {
    let params = new HttpParams().set('limit', options.limit ?? 20);
    if (options.businessId) {
      params = params.set('businessId', options.businessId);
    }
    return this.http
      .get<ApiListEnvelope<CustomerReceipt>>(`${this.baseUrl}/receipts`, { params })
      .pipe(map((response) => this.toPage(response, options.limit ?? 20)));
  }

  submitReview(input: CustomerReviewInput, idempotencyKey = crypto.randomUUID()): Observable<CustomerReviewSubmission> {
    return this.http
      .post<
        ApiObjectEnvelope<CustomerReviewSubmission>
      >(`${this.baseUrl}/reviews`, input, { headers: { 'Idempotency-Key': idempotencyKey } })
      .pipe(map((response) => response.data));
  }

  private toPage<T>(response: ApiListEnvelope<T>, fallbackLimit: number): CustomerPage<T> {
    return {
      items: response.data,
      page: response.meta?.page ?? { limit: fallbackLimit, nextCursor: null, hasMore: false },
    };
  }
}

export interface CustomerReceiptsQuery {
  readonly businessId?: string;
  readonly limit?: number;
}
