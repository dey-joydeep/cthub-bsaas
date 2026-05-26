export interface PublicPage<T> {
  readonly items: readonly T[];
  readonly page: {
    readonly limit: number;
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  };
}

export interface PublicSeoModel {
  readonly title: string;
  readonly description: string;
}

export interface PublicSalonSummaryModel {
  readonly salonId: string;
  readonly slug: string;
  readonly name: string;
  readonly area: string | null;
  readonly rating: string;
  readonly reviewCount: number;
  readonly startingPrice: string | null;
  readonly nextAvailability: string | null;
}

export interface PublicServiceModel {
  readonly serviceId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly priceFrom: string;
  readonly category: {
    readonly categoryId: string;
    readonly name: string;
  };
  readonly bookable: boolean;
}

export interface PublicBranchModel {
  readonly branchId: string;
  readonly name: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly timezone: string;
  readonly currency: string;
  readonly address: PublicAddressModel;
}

export interface PublicAddressModel {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface PublicSalonProfileModel {
  readonly salonId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly branches: readonly PublicBranchModel[];
  readonly ratingSummary: {
    readonly averageRating: string;
    readonly reviewCount: number;
  };
  readonly gallery: readonly PublicPortfolioModel[];
  readonly policies: {
    readonly cancellationCutoffMinutes: number | null;
    readonly bookingLeadMinutes: number | null;
  };
  readonly seo: PublicSeoModel;
}

export interface PublicReviewModel {
  readonly reviewId: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly customerDisplayName: string;
  readonly visitedAt: string;
  readonly ownerReply: string | null;
}

export interface PublicPortfolioModel {
  readonly mediaId: string;
  readonly imageUrl: string;
  readonly caption: string | null;
  readonly serviceTags: readonly string[];
  readonly createdAt: string;
}

export interface PublicAvailabilityModel {
  readonly hasAvailability: boolean;
  readonly earliestSlotAt: string | null;
  readonly branchSignals: readonly {
    readonly branchId: string;
    readonly hasAvailability: boolean;
    readonly earliestSlotAt: string | null;
  }[];
}

export interface PublicHomeModel {
  readonly featuredSalons: readonly PublicSalonSummaryModel[];
  readonly popularServices: readonly PublicServiceModel[];
  readonly nearbyAreas: readonly string[];
  readonly seo: PublicSeoModel;
}
