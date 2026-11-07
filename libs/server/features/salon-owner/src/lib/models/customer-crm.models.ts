export interface CustomerModel {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly dateOfBirth?: string;
  readonly consentForMarketing: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CustomerNoteModel {
  readonly id: string;
  readonly customerId: string;
  readonly body: string;
  readonly visibility: 'INTERNAL' | 'STAFF_VISIBLE';
  readonly createdAt: string;
}

export interface CommunicationPreferencesModel {
  readonly customerId: string;
  readonly smsEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly whatsappEnabled: boolean;
}

export interface CustomerVisitModel {
  readonly id: string;
  readonly occurredAt: string;
  readonly type: 'APPOINTMENT' | 'INVOICE';
  readonly summary: string;
}
