import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface CreateAppointmentParams {
  salonId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  notes?: string;
  status?: AppointmentStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface UpdateAppointmentParams {
  id: string;
  salonId?: string;
  serviceId?: string;
  staffId?: string;
  appointmentDate?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
  status?: AppointmentStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface AppointmentQueryParams {
  salonId?: string;
  staffId?: string;
  customerId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
