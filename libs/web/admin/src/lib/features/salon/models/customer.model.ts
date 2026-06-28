export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    notifications?: boolean;
    marketingEmails?: boolean;
    smsAlerts?: boolean;
    language?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  notes?: string;
  totalAppointments?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  membershipStatus?: 'none' | 'basic' | 'premium' | 'vip';
  referralCode?: string;
  referredBy?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}
