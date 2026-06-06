export interface ApiObjectEnvelope<T> {
  readonly success: boolean;
  readonly data: T;
}

export interface ApiListEnvelope<T> {
  readonly success: boolean;
  readonly data: readonly T[];
  readonly meta?: {
    readonly page?: CustomerPageMeta;
  };
}

export interface CustomerPage<T> {
  readonly items: readonly T[];
  readonly page: CustomerPageMeta;
}

export interface CustomerPageMeta {
  readonly limit: number;
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface CustomerSalonRef {
  readonly businessId: string;
  readonly name: string;
}

export interface CustomerBranchRef {
  readonly branchId: string;
  readonly name: string;
  readonly timezone: string;
  readonly currency: string;
}

export interface CustomerServiceRef {
  readonly serviceId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly price: string;
}

export interface CustomerAppointment {
  readonly appointmentId: string;
  readonly status: string;
  readonly salon: CustomerSalonRef;
  readonly branch: CustomerBranchRef;
  readonly startAt: string;
  readonly endAt: string;
  readonly services: readonly CustomerServiceRef[];
  readonly actions: readonly string[];
}

export interface CustomerBookingContext {
  readonly salon: CustomerSalonRef;
  readonly branches: readonly CustomerBranchRef[];
  readonly services: readonly CustomerServiceRef[];
  readonly staffOptions: readonly CustomerStaffOption[];
  readonly policySummary: {
    readonly bookingLeadMinutes: number;
    readonly cancellationCutoffMinutes: number;
  };
  readonly availableDateRange: {
    readonly from: string;
    readonly to: string;
  };
}

export interface CustomerStaffOption {
  readonly staffId: string;
  readonly displayName: string;
}

export interface CustomerBookingInput {
  readonly businessId: string;
  readonly branchId: string;
  readonly serviceIds: readonly string[];
  readonly startAt: string;
  readonly staffId?: string;
  readonly notes?: string;
}

export interface CustomerBooking {
  readonly appointmentId: string;
  readonly status: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly salon: CustomerSalonRef;
  readonly services: readonly CustomerServiceRef[];
  readonly policySnapshot: {
    readonly cancellationCutoffMinutes: number;
  };
}

export interface CustomerDashboard {
  readonly upcomingAppointment: CustomerAppointment | null;
  readonly recentVisits: readonly CustomerAppointment[];
  readonly rewardSummary: {
    readonly pointsBalance: number;
    readonly tier: string;
  };
  readonly pendingReceipts: readonly CustomerReceipt[];
  readonly recommendedSalons: readonly CustomerSalonRef[];
}

export interface CustomerFavorite {
  readonly targetType: string;
  readonly targetId: string;
  readonly label: string | null;
  readonly imageUrl: string | null;
  readonly addedAt: string;
}

export interface CustomerFavoriteMutation {
  readonly targetType: string;
  readonly targetId: string;
  readonly favorite: boolean;
  readonly updatedAt: string;
}

export interface CustomerReward {
  readonly businessId: string;
  readonly pointsBalance: number;
  readonly tier: string;
  readonly availableBenefits: readonly string[];
  readonly expiresAt: string | null;
}

export interface CustomerReceipt {
  readonly receiptId: string;
  readonly businessName: string;
  readonly invoiceNumber: string;
  readonly total: string;
  readonly paid: string;
  readonly due: string;
  readonly currency: string;
  readonly issuedAt: string;
}

export interface CustomerReviewInput {
  readonly appointmentId: string;
  readonly rating: number;
  readonly comment?: string;
}

export interface CustomerReviewSubmission {
  readonly reviewId: string;
  readonly status: string;
  readonly submittedAt: string;
  readonly moderationState: string;
}

export interface CustomerBookingContextQuery {
  readonly businessId?: string;
  readonly branchId?: string;
  readonly serviceId?: string;
}

export interface CustomerCancelInput {
  readonly reason: string;
  readonly notes?: string;
}

export interface CustomerCancelResult {
  readonly appointmentId: string;
  readonly status: string;
  readonly cancelledAt: string;
  readonly policyImpact: string;
}

export interface CustomerRescheduleInput {
  readonly startAt: string;
  readonly staffId?: string;
  readonly reason?: string;
}
