import type { PagedEnvelope } from '../../salon-owner-settings/models/salon-owner-settings.models';

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface AppointmentLineInput {
  readonly serviceId: string;
  readonly staffId: string;
  readonly startsAt: string;
}

export interface AppointmentInput {
  readonly branchId: string;
  readonly customerId: string;
  readonly lines: readonly AppointmentLineInput[];
  readonly notes?: string;
}

export interface WalkInAppointmentInput extends AppointmentInput {
  readonly estimatedWaitMinutes?: number;
}

export interface RescheduleAppointmentInput {
  readonly lines: readonly AppointmentLineInput[];
  readonly reason: string;
}

export interface AppointmentLine {
  readonly id: string;
  readonly serviceId: string;
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly serviceName: string;
  readonly staffName: string;
  readonly durationMinutes: number;
}

export interface Appointment {
  readonly id: string;
  readonly branchId: string;
  readonly customerId: string;
  readonly status: AppointmentStatus;
  readonly lines: readonly AppointmentLine[];
  readonly notes?: string;
  readonly estimatedWaitMinutes?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AppointmentDayBoard {
  readonly branchId: string;
  readonly date: string;
  readonly appointments: readonly Appointment[];
}

export interface AvailableSlot {
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export type AvailableSlotPage = PagedEnvelope<AvailableSlot>;
