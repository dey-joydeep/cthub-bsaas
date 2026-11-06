import type { PagedEnvelope } from '../../salon-owner-settings/models/salon-owner-settings.models';

export interface CustomerInput {
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly dateOfBirth?: string;
  readonly consentForMarketing?: boolean;
}

export interface Customer extends CustomerInput {
  readonly id: string;
  readonly consentForMarketing: boolean;
  readonly smsEnabled?: boolean;
  readonly emailEnabled?: boolean;
  readonly whatsappEnabled?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CustomerNoteInput {
  readonly body: string;
  readonly visibility: 'INTERNAL' | 'STAFF_VISIBLE';
}

export interface CommunicationPreferencesInput {
  readonly smsEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly whatsappEnabled: boolean;
}

export interface CustomerVisitHistoryItem {
  readonly id?: string;
  readonly branchId?: string;
  readonly branchName?: string;
  readonly visitedAt?: string;
  readonly startsAt?: string;
  readonly status?: string;
  readonly total?: string;
  readonly serviceNames?: readonly string[];
}

export type CustomerPage = PagedEnvelope<Customer>;
export type CustomerVisitHistoryPage = PagedEnvelope<CustomerVisitHistoryItem>;
