import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export interface AppointmentWithDetails {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  staffId: string;
  staffName: string;
  salonId: string;
  salonName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  paymentStatus: string;
  amountPaid: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: any;
}
