import { AppointmentStatus, Prisma } from '@prisma/client';

export interface UserWithMinimalInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface StaffWithUser {
  id: string;
  userId: string;
  user: UserWithMinimalInfo;
  position?: string | null;
  bio?: string | null;
  isActive: boolean;
}

export interface ServiceWithDetails {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string | null;
  isActive: boolean;
}

export interface TenantServiceWithDetails {
  id: string;
  service: ServiceWithDetails;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface AppointmentServiceWithDetails {
  id: string;
  tenantService: TenantServiceWithDetails;
  staff: StaffWithUser;
  startTime: Date;
  endTime: Date;
  price: number;
  duration: number;
}

export interface SalonWithAddress {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface CustomerWithUser {
  id: string;
  userId: string;
  user: UserWithMinimalInfo;
  dateOfBirth?: Date | null;
  gender?: string | null;
  notes?: string | null;
}

export interface AppointmentWithRelations {
  id: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string | null;
  totalPrice: number;
  totalDuration: number;
  isPaid: boolean;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  cancellationReason?: string | null;
  cancellationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  customer: CustomerWithUser;
  staff?: StaffWithUser | null;
  services: AppointmentServiceWithDetails[];
  salon: SalonWithAddress;

  // Optional metadata
  metadata?: Prisma.JsonValue;
}
