import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface Appointment {
  id: string;
  title: string;
  customerName: string;
  staffName: string;
  serviceName: string;
  startTime: string;
  duration: number;
  status: AppointmentStatus;
  endTime: string;
}

export interface AppointmentsFilter {
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AppointmentsOverview {
  totalAppointments: number;
  upcomingAppointments: Appointment[];
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
}

export interface StatusBadgeConfig {
  text: string;
  class: string;
  icon: string;
}
