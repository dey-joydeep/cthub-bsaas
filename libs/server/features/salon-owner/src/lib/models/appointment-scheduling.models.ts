export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface AppointmentLineModel {
  readonly id: string;
  readonly serviceId: string;
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly serviceName: string;
  readonly staffName: string;
  readonly durationMinutes: number;
}

export interface AppointmentModel {
  readonly id: string;
  readonly branchId: string;
  readonly customerId: string;
  readonly status: AppointmentStatus;
  readonly lines: readonly AppointmentLineModel[];
  readonly notes?: string;
  readonly estimatedWaitMinutes?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AppointmentDayBoardModel {
  readonly branchId: string;
  readonly date: string;
  readonly appointments: readonly AppointmentModel[];
}

export interface AvailableSlotModel {
  readonly staffId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}
