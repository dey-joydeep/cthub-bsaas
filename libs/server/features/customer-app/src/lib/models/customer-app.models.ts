export interface CustomerPage<T> {
  readonly items: readonly T[];
  readonly page: {
    readonly limit: number;
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  };
}

export interface CustomerSalonRefModel {
  readonly businessId: string;
  readonly name: string;
}

export interface CustomerBranchRefModel {
  readonly branchId: string;
  readonly name: string;
  readonly timezone: string;
  readonly currency: string;
}

export interface CustomerServiceRefModel {
  readonly serviceId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly price: string;
}

export interface CustomerAppointmentModel {
  readonly appointmentId: string;
  readonly status: string;
  readonly salon: CustomerSalonRefModel;
  readonly branch: CustomerBranchRefModel;
  readonly startAt: string;
  readonly endAt: string;
  readonly services: readonly CustomerServiceRefModel[];
  readonly actions: readonly string[];
}

export interface CustomerBookingContextModel {
  readonly salon: CustomerSalonRefModel;
  readonly branches: readonly CustomerBranchRefModel[];
  readonly services: readonly CustomerServiceRefModel[];
  readonly staffOptions: readonly {
    readonly staffId: string;
    readonly displayName: string;
  }[];
  readonly policySummary: {
    readonly bookingLeadMinutes: number;
    readonly cancellationCutoffMinutes: number;
  };
  readonly availableDateRange: {
    readonly from: string;
    readonly to: string;
  };
}

export interface CustomerBookingModel {
  readonly appointmentId: string;
  readonly status: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly salon: CustomerSalonRefModel;
  readonly services: readonly CustomerServiceRefModel[];
  readonly policySnapshot: {
    readonly cancellationCutoffMinutes: number;
  };
}

export interface CustomerDashboardModel {
  readonly upcomingAppointment: CustomerAppointmentModel | null;
  readonly recentVisits: readonly CustomerAppointmentModel[];
  readonly rewardSummary: {
    readonly pointsBalance: number;
    readonly tier: string;
  };
  readonly pendingReceipts: readonly CustomerReceiptModel[];
  readonly recommendedSalons: readonly CustomerSalonRefModel[];
}

export interface CustomerFavoriteModel {
  readonly targetType: string;
  readonly targetId: string;
  readonly label: string | null;
  readonly imageUrl: string | null;
  readonly addedAt: string;
}

export interface CustomerFavoriteMutationModel {
  readonly targetType: string;
  readonly targetId: string;
  readonly favorite: boolean;
  readonly updatedAt: string;
}

export interface CustomerRewardModel {
  readonly businessId: string;
  readonly pointsBalance: number;
  readonly tier: string;
  readonly availableBenefits: readonly string[];
  readonly expiresAt: string | null;
}

export interface CustomerReceiptModel {
  readonly receiptId: string;
  readonly businessName: string;
  readonly invoiceNumber: string;
  readonly total: string;
  readonly paid: string;
  readonly due: string;
  readonly currency: string;
  readonly issuedAt: string;
}

export interface CustomerReviewSubmissionModel {
  readonly reviewId: string;
  readonly status: string;
  readonly submittedAt: string;
  readonly moderationState: string;
}
