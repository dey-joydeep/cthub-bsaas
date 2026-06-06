export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly data: T;
}

export interface PublicPage<T> {
  readonly items: readonly T[];
  readonly page: {
    readonly limit: number;
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  };
}

export interface PublicSalonSummary {
  readonly salonId: string;
  readonly slug: string;
  readonly name: string;
  readonly area: string | null;
  readonly rating: string;
  readonly reviewCount: number;
  readonly startingPrice: string | null;
  readonly nextAvailability: string | null;
}

export interface PublicService {
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

export interface PublicHome {
  readonly featuredSalons: readonly PublicSalonSummary[];
  readonly popularServices: readonly PublicService[];
  readonly nearbyAreas: readonly string[];
}

export interface PublicSalonProfile {
  readonly salonId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly branches: readonly {
    readonly branchId: string;
    readonly name: string;
    readonly phone: string | null;
    readonly email: string | null;
    readonly address: {
      readonly line1: string;
      readonly city: string;
      readonly state: string;
      readonly postalCode: string;
      readonly country: string;
    };
  }[];
  readonly ratingSummary: {
    readonly averageRating: string;
    readonly reviewCount: number;
  };
  readonly gallery: readonly { readonly imageUrl: string; readonly caption: string | null }[];
}

export interface PublicReview {
  readonly reviewId: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly customerDisplayName: string;
  readonly visitedAt: string;
}
