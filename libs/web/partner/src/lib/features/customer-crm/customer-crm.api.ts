import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ResponseEnvelope as ApiEnvelope } from '../salon-owner-settings/models/salon-owner-settings.models';
import {
  CommunicationPreferencesInput,
  Customer,
  CustomerInput,
  CustomerNoteInput,
  CustomerPage,
  CustomerVisitHistoryPage,
} from './models/customer-crm.models';

@Injectable({ providedIn: 'root' })
export class CustomerCrmApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner/customers';

  searchCustomers(search?: string): Observable<CustomerPage> {
    const params = search ? new HttpParams().set('q', search) : undefined;
    return this.http.get<ApiEnvelope<CustomerPage>>(this.baseUrl, { params }).pipe(map((response) => response.data));
  }

  createCustomer(input: CustomerInput): Observable<Customer> {
    return this.http.post<ApiEnvelope<Customer>>(this.baseUrl, input).pipe(map((response) => response.data));
  }

  updateCustomer(customerId: string, input: CustomerInput): Observable<Customer> {
    return this.http.patch<ApiEnvelope<Customer>>(`${this.baseUrl}/${customerId}`, input).pipe(map((response) => response.data));
  }

  createCustomerNote(customerId: string, input: CustomerNoteInput): Observable<CustomerNoteInput> {
    return this.http
      .post<ApiEnvelope<CustomerNoteInput>>(`${this.baseUrl}/${customerId}/notes`, input)
      .pipe(map((response) => response.data));
  }

  updateCustomerCommunicationPreferences(
    customerId: string,
    input: CommunicationPreferencesInput,
  ): Observable<CommunicationPreferencesInput> {
    return this.http
      .put<ApiEnvelope<CommunicationPreferencesInput>>(`${this.baseUrl}/${customerId}/communication-preferences`, input)
      .pipe(map((response) => response.data));
  }

  getCustomerVisitHistory(customerId: string): Observable<CustomerVisitHistoryPage> {
    return this.http
      .get<ApiEnvelope<CustomerVisitHistoryPage>>(`${this.baseUrl}/${customerId}/visit-history`)
      .pipe(map((response) => response.data));
  }
}
