import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ApiEnvelope,
  BranchHolidayInput,
  BranchPolicyInput,
  BranchProfile,
  BranchProfileInput,
  PagedEnvelope,
  SalonBusiness,
  SalonBusinessInput,
  WeeklyHoursInput,
} from './models/salon-owner-settings.models';

@Injectable({ providedIn: 'root' })
export class SalonOwnerSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner';

  listBusinesses(): Observable<PagedEnvelope<SalonBusiness>> {
    return this.http.get<ApiEnvelope<PagedEnvelope<SalonBusiness>>>(`${this.baseUrl}/businesses`).pipe(map((response) => response.data));
  }

  createBusiness(input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.http.post<ApiEnvelope<SalonBusiness>>(`${this.baseUrl}/businesses`, input).pipe(map((response) => response.data));
  }

  updateBusiness(businessId: string, input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.http
      .patch<ApiEnvelope<SalonBusiness>>(`${this.baseUrl}/businesses/${businessId}`, input)
      .pipe(map((response) => response.data));
  }

  listBranches(businessId?: string): Observable<PagedEnvelope<BranchProfile>> {
    const params = businessId ? new HttpParams().set('businessId', businessId) : undefined;
    return this.http
      .get<ApiEnvelope<PagedEnvelope<BranchProfile>>>(`${this.baseUrl}/branches`, { params })
      .pipe(map((response) => response.data));
  }

  createBranch(input: BranchProfileInput): Observable<BranchProfile> {
    return this.http.post<ApiEnvelope<BranchProfile>>(`${this.baseUrl}/branches`, input).pipe(map((response) => response.data));
  }

  updateBranch(branchId: string, input: BranchProfileInput): Observable<BranchProfile> {
    return this.http
      .patch<ApiEnvelope<BranchProfile>>(`${this.baseUrl}/branches/${branchId}`, input)
      .pipe(map((response) => response.data));
  }

  replaceBranchHours(branchId: string, input: WeeklyHoursInput): Observable<WeeklyHoursInput> {
    return this.http
      .put<ApiEnvelope<WeeklyHoursInput>>(`${this.baseUrl}/branches/${branchId}/hours`, input)
      .pipe(map((response) => response.data));
  }

  setBranchHoliday(branchId: string, date: string, input: BranchHolidayInput): Observable<BranchHolidayInput> {
    return this.http
      .put<ApiEnvelope<BranchHolidayInput>>(`${this.baseUrl}/branches/${branchId}/holidays/${date}`, input)
      .pipe(map((response) => response.data));
  }

  updateBranchPolicy(branchId: string, input: BranchPolicyInput): Observable<BranchPolicyInput> {
    return this.http
      .put<ApiEnvelope<BranchPolicyInput>>(`${this.baseUrl}/branches/${branchId}/policy`, input)
      .pipe(map((response) => response.data));
  }
}
