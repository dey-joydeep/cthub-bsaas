// SalonStaffRequest model for salon-staff-request module

// Inline SalonStaffRequestStatus enum since '../../models/enums' does not exist
export enum SalonStaffRequestStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
}

export interface SalonStaffRequest {
  id: string;
  salonId: string;
  userId: string;
  status: SalonStaffRequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
}
