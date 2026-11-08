import type { SalonOwnerStatus, TimeIntervalModel } from './salon-owner-settings.models';

export type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STYLIST' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface StaffModel {
  readonly id: string;
  readonly branchIds: readonly string[];
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly status: SalonOwnerStatus;
  readonly roles: readonly string[];
  readonly roleIds: readonly string[];
  readonly skillServiceIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BusinessRoleModel {
  readonly id: string;
  readonly businessId: string;
  readonly roleCode: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly permissions: readonly string[];
  readonly isSystemDefault: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PermissionItemModel {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export interface StaffShiftDayModel {
  readonly dayOfWeek: number;
  readonly intervals: readonly TimeIntervalModel[];
}

export interface StaffShiftModel {
  readonly staffId: string;
  readonly branchId: string;
  readonly timezone: string;
  readonly days: readonly StaffShiftDayModel[];
}

export interface StaffLeaveBlockModel {
  readonly id: string;
  readonly staffId: string;
  readonly branchId: string | null;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly reason: string;
}

export interface SuccessResult {
  readonly success: boolean;
}

export interface ServiceCategoryModel {
  readonly id: string;
  readonly name: string;
  readonly sortOrder: number;
}

export interface ServiceModel {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly bufferMinutes: number;
  readonly basePrice: string;
  readonly taxRatePercent: string;
  readonly status: SalonOwnerStatus;
  readonly eligibleStaffIds: readonly string[];
}

export interface BranchServiceOverrideModel {
  readonly id: string;
  readonly serviceId: string;
  readonly branchId: string;
  readonly priceOverride: string | null;
  readonly durationOverrideMinutes: number | null;
  readonly visibleOnline: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type StaffGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
export type StaffEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'APPRENTICE';
export type StaffPayoutMethod = 'BANK_TRANSFER' | 'CASH';
export type StaffBankAccountType = 'ORDINARY' | 'CURRENT';
export type StaffDocumentType = 'DRIVERS_LICENSE' | 'RESIDENCE_CARD' | 'PASSPORT' | 'MY_NUMBER_CARD' | 'OTHER';
export type StaffDocVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface StaffResidentialAddressModel {
  readonly line1?: string;
  readonly line2?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
}

export interface StaffEmergencyContactModel {
  readonly name?: string;
  readonly relationship?: string;
  readonly phone?: string;
}

export interface StaffBankDetailsModel {
  readonly bankName?: string;
  readonly branchName?: string;
  readonly branchCode?: string;
  readonly accountType?: StaffBankAccountType;
  readonly accountNumber?: string;
  readonly accountHolder?: string;
}

export interface StaffPersonalProfileModel {
  readonly staffId: string;
  readonly legalName?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: StaffGender | null;
  readonly address?: StaffResidentialAddressModel;
  readonly emergencyContact?: StaffEmergencyContactModel;
  readonly employmentType: StaffEmploymentType;
  readonly hireDate: string;
  readonly terminationDate?: string | null;
  readonly payoutMethod: StaffPayoutMethod;
  readonly bankDetails?: StaffBankDetailsModel;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StaffIdentityDocumentModel {
  readonly id: string;
  readonly staffId: string;
  readonly documentType: StaffDocumentType;
  readonly fileKey: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly verificationStatus: StaffDocVerificationStatus;
  readonly verifiedByUserId?: string | null;
  readonly verifiedAt?: string | null;
  readonly rejectionReason?: string | null;
  readonly downloadUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
