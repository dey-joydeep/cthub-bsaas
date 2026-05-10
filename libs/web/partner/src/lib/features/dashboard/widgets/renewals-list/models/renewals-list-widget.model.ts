export type RenewalStatus = 'pending' | 'completed' | 'overdue';

export interface Renewal {
  id?: string;
  salonName: string;
  customerName?: string;
  serviceName?: string;
  renewalDate: string;
  amount?: number;
  status?: RenewalStatus;
}
