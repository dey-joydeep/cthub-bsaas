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

export type CustomerPage = PagedEnvelope<Customer>;
