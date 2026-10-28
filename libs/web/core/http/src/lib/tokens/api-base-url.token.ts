import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export const PARTNER_API_BASE_URL = new InjectionToken<string>('PARTNER_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/partner',
});
