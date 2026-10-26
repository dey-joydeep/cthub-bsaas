// Using direct imports for better tree-shaking and explicit dependencies
import { Customer } from './customer.model';
import { Salon } from './salon.model';
import { Service } from './service.model';
import { Staff } from './staff.model';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface BaseAppointment {
  id: string;
  salonId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  appointmentDate: Date | string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface Appointment extends BaseAppointment {
  salon?: Salon;
  service?: Service;
  staff?: Staff;
  customer?: Customer;
}

export interface AppointmentTimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
  staffName?: string;
}

export interface AppointmentCalendarDay {
  date: Date;
  available: boolean;
  hasAvailability: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  isDisabled: boolean;
  appointments: Appointment[];
}

export interface AppointmentCalendar {
  days: AppointmentCalendarDay[];
  currentDate: Date;
  month: number;
  year: number;
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}
