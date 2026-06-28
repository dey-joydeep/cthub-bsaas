export interface Renewal {
  id: string;
  customerId: string;
  customerName: string;
  subscriptionId: string;
  serviceName: string;
  renewalDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}
