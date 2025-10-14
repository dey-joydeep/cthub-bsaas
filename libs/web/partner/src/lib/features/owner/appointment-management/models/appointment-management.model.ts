export interface Appointment {
  id: string;
  date: Date;
  clientName: string;
  serviceName: string;
  staffName: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}
