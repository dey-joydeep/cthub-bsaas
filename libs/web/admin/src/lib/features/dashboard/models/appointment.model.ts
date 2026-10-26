import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  customerId: string;
  customerName: string;
  customerEmail: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
  salonId: string;
  salonName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsOverview {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  averageDuration: number;
  upcomingAppointments: Appointment[];
  recentAppointments: Appointment[];
  statusDistribution: Record<string, number>;
  dailyAppointments: Record<string, number>;
}

export interface AppointmentsFilter {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  staffId?: string;
  customerId?: string;
  serviceId?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AppointmentsPageableResponse {
  items: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
