import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  salonId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DialogResult {
  action: 'confirm' | 'cancel';
  reason?: string;
}

export interface TimeSlot {
  time: string;
  available?: boolean;
}
