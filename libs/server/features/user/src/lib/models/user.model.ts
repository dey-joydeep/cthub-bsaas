// moved from models/user.model.ts

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
  tenantId: string;
  name: string;
  updatedAt: Date;
  lastLoginAt?: Date;
  roles: Role[];
  saasOwner?: SaasOwner;
  salonStaff?: SalonStaff;
  customer?: Customer;
}

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  userId: string;
  roleId: number;
}

export interface SaasOwner {
  userId: string;
  permissions: string[];
  managedTenants: string[]; // List of tenant IDs managed by this SaaS owner
}

export interface SalonStaff {
  userId: string;
  salonId: string;
  position: string; // e.g., 'stylist', 'receptionist', etc.
  isActive: boolean;
  hiredAt: Date;
}

export interface Customer {
  userId: string;
  preferredSalonId?: string;
  loyaltyPoints?: number;
}
