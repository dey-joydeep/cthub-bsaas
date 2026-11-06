import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ResponseEnvelope as ApiEnvelope } from '../salon-owner-settings/models/salon-owner-settings.models';
import {
  Service,
  ServiceCategory,
  ServiceCategoryInput,
  ServiceCategoryPage,
  ServiceInput,
  ServicePage,
  ServiceStatusInput,
  Staff,
  StaffEligibilityInput,
  StaffInput,
  StaffLeaveBlock,
  StaffLeaveBlockInput,
  StaffLeaveBlockPage,
  StaffPage,
  StaffRolesInput,
  StaffShiftInput,
  StaffSkillsInput,
} from './models/staff-service-catalog.models';

@Injectable({ providedIn: 'root' })
export class StaffServiceCatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner';

  listStaff(branchId?: string): Observable<StaffPage> {
    const params = branchId ? new HttpParams().set('branchId', branchId) : undefined;
    return this.http.get<ApiEnvelope<StaffPage>>(`${this.baseUrl}/staff`, { params }).pipe(map((response) => response.data));
  }

  createStaff(input: StaffInput): Observable<Staff> {
    return this.http.post<ApiEnvelope<Staff>>(`${this.baseUrl}/staff`, input).pipe(map((response) => response.data));
  }

  updateStaff(staffId: string, input: StaffInput): Observable<Staff> {
    return this.http.patch<ApiEnvelope<Staff>>(`${this.baseUrl}/staff/${staffId}`, input).pipe(map((response) => response.data));
  }

  replaceStaffRoles(staffId: string, input: StaffRolesInput): Observable<Staff> {
    return this.http.put<ApiEnvelope<Staff>>(`${this.baseUrl}/staff/${staffId}/roles`, input).pipe(map((response) => response.data));
  }

  replaceStaffSkills(staffId: string, input: StaffSkillsInput): Observable<Staff> {
    return this.http.put<ApiEnvelope<Staff>>(`${this.baseUrl}/staff/${staffId}/skills`, input).pipe(map((response) => response.data));
  }

  replaceStaffShifts(staffId: string, input: StaffShiftInput): Observable<StaffShiftInput> {
    return this.http
      .put<ApiEnvelope<StaffShiftInput>>(`${this.baseUrl}/staff/${staffId}/shifts`, input)
      .pipe(map((response) => response.data));
  }

  listStaffLeaveBlocks(staffId: string, branchId?: string): Observable<StaffLeaveBlockPage> {
    const params = branchId ? new HttpParams().set('branchId', branchId) : undefined;
    return this.http
      .get<ApiEnvelope<StaffLeaveBlockPage>>(`${this.baseUrl}/staff/${staffId}/leave-blocks`, { params })
      .pipe(map((response) => response.data));
  }

  createStaffLeaveBlock(staffId: string, input: StaffLeaveBlockInput): Observable<StaffLeaveBlock> {
    return this.http
      .post<ApiEnvelope<StaffLeaveBlock>>(`${this.baseUrl}/staff/${staffId}/leave-blocks`, input)
      .pipe(map((response) => response.data));
  }

  deleteStaffLeaveBlock(staffId: string, leaveBlockId: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiEnvelope<{ success: boolean }>>(`${this.baseUrl}/staff/${staffId}/leave-blocks/${leaveBlockId}`)
      .pipe(map((response) => response.data));
  }

  listServiceCategories(): Observable<ServiceCategoryPage> {
    return this.http.get<ApiEnvelope<ServiceCategoryPage>>(`${this.baseUrl}/service-categories`).pipe(map((response) => response.data));
  }

  createServiceCategory(input: ServiceCategoryInput): Observable<ServiceCategory> {
    return this.http.post<ApiEnvelope<ServiceCategory>>(`${this.baseUrl}/service-categories`, input).pipe(map((response) => response.data));
  }

  listServices(categoryId?: string): Observable<ServicePage> {
    const params = categoryId ? new HttpParams().set('categoryId', categoryId) : undefined;
    return this.http.get<ApiEnvelope<ServicePage>>(`${this.baseUrl}/services`, { params }).pipe(map((response) => response.data));
  }

  createService(input: ServiceInput): Observable<Service> {
    return this.http.post<ApiEnvelope<Service>>(`${this.baseUrl}/services`, input).pipe(map((response) => response.data));
  }

  updateService(serviceId: string, input: ServiceInput): Observable<Service> {
    return this.http.patch<ApiEnvelope<Service>>(`${this.baseUrl}/services/${serviceId}`, input).pipe(map((response) => response.data));
  }

  updateServiceStatus(serviceId: string, input: ServiceStatusInput): Observable<Service> {
    return this.http
      .put<ApiEnvelope<Service>>(`${this.baseUrl}/services/${serviceId}/status`, input)
      .pipe(map((response) => response.data));
  }

  replaceServiceStaffEligibility(serviceId: string, input: StaffEligibilityInput): Observable<Service> {
    return this.http
      .put<ApiEnvelope<Service>>(`${this.baseUrl}/services/${serviceId}/staff-eligibility`, input)
      .pipe(map((response) => response.data));
  }
}
