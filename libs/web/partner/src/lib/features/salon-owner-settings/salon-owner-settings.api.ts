import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PARTNER_API_BASE_URL } from '@cthub-bsaas/web-core-http';

import {
  BranchHours,
  BranchHolidayInput,
  BranchPolicy,
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
  private readonly baseUrl = inject(PARTNER_API_BASE_URL);

  listBusinesses(): Observable<PagedEnvelope<SalonBusiness>> {
    return this.http.get<PagedEnvelope<SalonBusiness>>(`${this.baseUrl}/businesses`);
  }

  createBusiness(input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.http.post<SalonBusiness>(`${this.baseUrl}/businesses`, input);
  }

  updateBusiness(businessId: string, input: SalonBusinessInput): Observable<SalonBusiness> {
    return this.http.patch<SalonBusiness>(`${this.baseUrl}/businesses/${businessId}`, input);
  }

  listBranches(businessId?: string): Observable<PagedEnvelope<BranchProfile>> {
    const params = businessId ? new HttpParams().set('businessId', businessId) : undefined;
    return this.http.get<PagedEnvelope<BranchProfile>>(`${this.baseUrl}/branches`, { params });
  }

  createBranch(input: BranchProfileInput): Observable<BranchProfile> {
    return this.http.post<BranchProfile>(`${this.baseUrl}/branches`, input);
  }

  updateBranch(branchId: string, input: BranchProfileInput): Observable<BranchProfile> {
    return this.http.patch<BranchProfile>(`${this.baseUrl}/branches/${branchId}`, input);
  }

  getBranchHours(branchId: string): Observable<BranchHours> {
    return this.http.get<BranchHours>(`${this.baseUrl}/branches/${branchId}/hours`);
  }

  replaceBranchHours(branchId: string, input: WeeklyHoursInput): Observable<BranchHours> {
    return this.http.put<BranchHours>(`${this.baseUrl}/branches/${branchId}/hours`, input);
  }

  setBranchHoliday(branchId: string, date: string, input: BranchHolidayInput): Observable<BranchHolidayInput> {
    return this.http.put<BranchHolidayInput>(`${this.baseUrl}/branches/${branchId}/holidays/${date}`, input);
  }

  getBranchPolicy(branchId: string): Observable<BranchPolicy> {
    return this.http.get<BranchPolicy>(`${this.baseUrl}/branches/${branchId}/policy`);
  }

  updateBranchPolicy(branchId: string, input: BranchPolicyInput): Observable<BranchPolicy> {
    return this.http.put<BranchPolicy>(`${this.baseUrl}/branches/${branchId}/policy`, input);
  }
}
