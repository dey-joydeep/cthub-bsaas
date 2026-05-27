import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SalonOwnerStatus } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import { PublicAvailabilityQueryDto, PublicHomeQueryDto, PublicSalonSearchQueryDto } from '../dto/public-discovery.dto';
import {
  PublicAddressModel,
  PublicAvailabilityModel,
  PublicBranchModel,
  PublicHomeModel,
  PublicPage,
  PublicPortfolioModel,
  PublicReviewModel,
  PublicSalonProfileModel,
  PublicSalonSummaryModel,
  PublicServiceModel,
} from '../models/public-discovery.models';

const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const defaultLimit = 20;

type BusinessRecord = Prisma.SalonBusinessGetPayload<{
  include: {
    branches: { include: { policy: true } };
    services: { include: { category: true } };
  };
}>;
type ReviewRecord = Prisma.CustomerReviewGetPayload<{ include: { user: true; appointment: { include: { lines: true } } } }>;
type ServiceRecord = Prisma.SalonOwnerServiceGetPayload<{ include: { category: true } }>;

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function toIso(value: Date): string {
  return value.toISOString();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function businessSlug(business: Pick<BusinessRecord, 'id' | 'displayName'>): string {
  return `${slugify(business.displayName)}-${business.id.slice(0, 8)}`;
}

function addressValue(value: Prisma.JsonValue): PublicAddressModel {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    line1: typeof record['line1'] === 'string' ? record['line1'] : '',
    line2: typeof record['line2'] === 'string' ? record['line2'] : undefined,
    city: typeof record['city'] === 'string' ? record['city'] : '',
    state: typeof record['state'] === 'string' ? record['state'] : '',
    postalCode: typeof record['postalCode'] === 'string' ? record['postalCode'] : '',
    country: typeof record['country'] === 'string' ? record['country'] : '',
  };
}

function requestedServices(input?: string | string[]): string[] {
  if (!input) {
    return [];
  }
  return Array.isArray(input)
    ? input
    : input
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

@Injectable()
export class PublicDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicHome(query: PublicHomeQueryDto): Promise<PublicHomeModel> {
    const salons = await this.searchPublicSalons({ city: query.city, area: query.area, limit: 6 });
    const popularServices = await this.prisma.salonOwnerService.findMany({
      where: { status: SalonOwnerStatus.ACTIVE, business: { status: SalonOwnerStatus.ACTIVE } },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
      take: 8,
    });
    return {
      featuredSalons: salons.items,
      popularServices: popularServices.map((service) => this.mapService(service)),
      nearbyAreas: [...new Set(salons.items.map((salon) => salon.area).filter((area): area is string => Boolean(area)))],
      seo: {
        title: 'Find salons and book appointments',
        description: 'Search public salon profiles, services, availability, and reviews.',
      },
    };
  }

  async searchPublicSalons(query: PublicSalonSearchQueryDto): Promise<PublicPage<PublicSalonSummaryModel>> {
    const limit = query.limit ?? defaultLimit;
    const businesses = await this.prisma.salonBusiness.findMany({
      where: {
        status: SalonOwnerStatus.ACTIVE,
        ...(query.q ? { displayName: { contains: query.q.trim(), mode: 'insensitive' } } : {}),
        ...(query.serviceId ? { services: { some: { id: query.serviceId, status: SalonOwnerStatus.ACTIVE } } } : {}),
      },
      include: {
        branches: { include: { policy: true }, orderBy: { name: 'asc' } },
        services: { include: { category: true }, where: { status: SalonOwnerStatus.ACTIVE }, orderBy: { basePrice: 'asc' } },
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    const filtered = businesses.filter((business) => this.matchesLocation(business, query.city, query.area));
    const summaries = await Promise.all(filtered.slice(0, limit).map((business) => this.mapSummary(business)));
    return {
      items: query.ratingMin ? summaries.filter((summary) => Number(summary.rating) >= Number(query.ratingMin)) : summaries,
      page: {
        limit,
        nextCursor: businesses.length > limit ? (businesses[limit]?.id ?? null) : null,
        hasMore: businesses.length > limit,
      },
    };
  }

  async getPublicSalonProfile(slug: string): Promise<PublicSalonProfileModel> {
    const business = await this.findBusinessBySlug(slug);
    const reviews = await this.findApprovedReviews(business.id, 100);
    const average = this.averageRating(reviews);
    return {
      salonId: business.id,
      slug: businessSlug(business),
      name: business.displayName,
      description: business.legalName,
      branches: business.branches.map((branch) => this.mapBranch(branch)),
      ratingSummary: { averageRating: average, reviewCount: reviews.length },
      gallery: [],
      policies: {
        bookingLeadMinutes: business.branches[0]?.policy?.bookingLeadMinutes ?? null,
        cancellationCutoffMinutes: business.branches[0]?.policy?.cancellationCutoffMinutes ?? null,
      },
      seo: {
        title: business.displayName,
        description: `${business.displayName} services, availability, reviews, and booking details.`,
      },
    };
  }

  async listPublicSalonServices(slug: string): Promise<PublicPage<PublicServiceModel>> {
    const business = await this.findBusinessBySlug(slug);
    return this.page(business.services.map((service) => this.mapService(service)));
  }

  async listPublicSalonReviews(slug: string, limit = defaultLimit): Promise<PublicPage<PublicReviewModel>> {
    const business = await this.findBusinessBySlug(slug);
    const reviews = await this.findApprovedReviews(business.id, limit);
    return this.page(
      reviews.map((review) => ({
        reviewId: review.id,
        rating: review.rating,
        comment: review.comment,
        customerDisplayName: review.user.name ?? 'Customer',
        visitedAt: toIso(review.appointment.lines[0]?.startsAt ?? review.createdAt),
        ownerReply: null,
      })),
      limit,
    );
  }

  async listPublicSalonPortfolio(slug: string): Promise<PublicPage<PublicPortfolioModel>> {
    await this.findBusinessBySlug(slug);
    return this.page([]);
  }

  async getPublicAvailabilitySignal(slug: string, query: PublicAvailabilityQueryDto): Promise<PublicAvailabilityModel> {
    const business = await this.findBusinessBySlug(slug);
    const serviceIds = requestedServices(query.serviceIds);
    const services = serviceIds.length > 0 ? business.services.filter((service) => serviceIds.includes(service.id)) : business.services;
    const day = query.date ? new Date(`${query.date}T09:00:00.000Z`) : this.nextBookableDay();
    const hasAvailability = business.branches.length > 0 && services.length > 0;
    const earliestSlotAt = hasAvailability ? toIso(day) : null;
    return {
      hasAvailability,
      earliestSlotAt,
      branchSignals: business.branches.map((branch) => ({ branchId: branch.id, hasAvailability, earliestSlotAt })),
    };
  }

  private async findBusinessBySlug(slug: string): Promise<BusinessRecord> {
    const businesses = await this.prisma.salonBusiness.findMany({
      where: { status: SalonOwnerStatus.ACTIVE },
      include: {
        branches: { include: { policy: true }, orderBy: { name: 'asc' } },
        services: { include: { category: true }, where: { status: SalonOwnerStatus.ACTIVE }, orderBy: { name: 'asc' } },
      },
    });
    const business = businesses.find((candidate) => businessSlug(candidate) === slug);
    if (!business) {
      throw new NotFoundException(notFoundMessage);
    }
    return business;
  }

  private matchesLocation(business: BusinessRecord, city?: string, area?: string): boolean {
    if (!city && !area) {
      return true;
    }
    return business.branches.some((branch) => {
      const address = addressValue(branch.address);
      return (
        (!city || address.city.toLowerCase() === city.toLowerCase()) && (!area || address.line1.toLowerCase().includes(area.toLowerCase()))
      );
    });
  }

  private async mapSummary(business: BusinessRecord): Promise<PublicSalonSummaryModel> {
    const reviews = await this.findApprovedReviews(business.id, 100);
    return {
      salonId: business.id,
      slug: businessSlug(business),
      name: business.displayName,
      area: business.branches[0] ? addressValue(business.branches[0].address).city : null,
      rating: this.averageRating(reviews),
      reviewCount: reviews.length,
      startingPrice: business.services[0] ? money(business.services[0].basePrice) : null,
      nextAvailability: business.branches.length > 0 && business.services.length > 0 ? toIso(this.nextBookableDay()) : null,
    };
  }

  private mapService(service: ServiceRecord): PublicServiceModel {
    return {
      serviceId: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceFrom: money(service.basePrice),
      category: { categoryId: service.category.id, name: service.category.name },
      bookable: service.status === SalonOwnerStatus.ACTIVE,
    };
  }

  private mapBranch(branch: BusinessRecord['branches'][number]): PublicBranchModel {
    return {
      branchId: branch.id,
      name: branch.name,
      phone: branch.phone,
      email: branch.email,
      timezone: branch.timezone,
      currency: branch.currency,
      address: addressValue(branch.address),
    };
  }

  private async findApprovedReviews(businessId: string, take: number): Promise<ReviewRecord[]> {
    return this.prisma.customerReview.findMany({
      where: { status: 'APPROVED', appointment: { branch: { businessId } } },
      include: { user: true, appointment: { include: { lines: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  private averageRating(reviews: readonly Pick<ReviewRecord, 'rating'>[]): string {
    if (reviews.length === 0) {
      return '0.0';
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }

  private nextBookableDay(): Date {
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(9, 0, 0, 0);
    return next;
  }

  private page<T>(items: readonly T[], limit = defaultLimit): PublicPage<T> {
    return { items, page: { limit, nextCursor: null, hasMore: false } };
  }
}
