// Keep frontend enums in sync with backend and DB
export enum SalonStaffRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SalonStaffRequestType {
  PROFILE_UPDATE = 'profile_update',
  LEAVE = 'leave',
}
