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
type BranchRecord = BusinessRecord['branches'][number];
type StaffShiftRecord = Prisma.SalonOwnerStaffShiftGetPayload<object>;
type AppointmentLineWindow = Pick<Prisma.SalonOwnerAppointmentLineGetPayload<object>, 'staffId' | 'startsAt' | 'endsAt'>;
type LeaveBlockWindow = Pick<Prisma.SalonOwnerStaffLeaveBlockGetPayload<object>, 'staffId' | 'startsAt' | 'endsAt'>;

interface TimeInterval {
  readonly start: string;
  readonly end: string;
}

interface StaffShiftDay {
  readonly dayOfWeek: number;
  readonly intervals: readonly TimeInterval[];
}

interface BranchAvailabilitySignal {
  readonly branchId: string;
  readonly hasAvailability: boolean;
  readonly earliestSlotAt: string | null;
}

interface AvailabilitySearchContext {
  readonly branch: BranchRecord;
  readonly services: readonly ServiceRecord[];
  readonly date?: string;
}

interface DateTimeParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

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
    const pageBusinesses = filtered.slice(0, limit);
    const summaries = await Promise.all(pageBusinesses.map((business) => this.mapSummary(business)));
    const items = query.ratingMin ? summaries.filter((summary) => Number(summary.rating) >= Number(query.ratingMin)) : summaries;
    const hasMore = businesses.length > limit;
    return {
      items,
      page: {
        limit,
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].salonId : null,
        hasMore,
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
    const branchSignals = await this.findBranchAvailabilitySignals(business.branches, services, query.date);
    const earliestSlotAt = this.earliestSlot(branchSignals);
    return {
      hasAvailability: branchSignals.some((signal) => signal.hasAvailability),
      earliestSlotAt,
      branchSignals,
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
    const branchSignals = await this.findBranchAvailabilitySignals(business.branches, business.services);
    return {
      salonId: business.id,
      slug: businessSlug(business),
      name: business.displayName,
      area: business.branches[0] ? addressValue(business.branches[0].address).city : null,
      rating: this.averageRating(reviews),
      reviewCount: reviews.length,
      startingPrice: business.services[0] ? money(business.services[0].basePrice) : null,
      nextAvailability: this.earliestSlot(branchSignals),
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

  private async findBranchAvailabilitySignals(
    branches: readonly BranchRecord[],
    services: readonly ServiceRecord[],
    date?: string,
  ): Promise<readonly BranchAvailabilitySignal[]> {
    return Promise.all(branches.map((branch) => this.findBranchAvailabilitySignal({ branch, services, date })));
  }

  private async findBranchAvailabilitySignal(context: AvailabilitySearchContext): Promise<BranchAvailabilitySignal> {
    const { branch, services } = context;
    if (services.length === 0) {
      return { branchId: branch.id, hasAvailability: false, earliestSlotAt: null };
    }
    const service = services[0];
    const date = context.date ?? this.nextBookableDate(branch.timezone);
    const dayOfWeek = this.dayOfWeek(date);
    const range = this.dateRangeUtc(date, branch.timezone);
    const [hours, holiday] = await Promise.all([
      this.prisma.salonBranchHours.findFirst({ where: { branchId: branch.id, dayOfWeek } }),
      this.prisma.salonBranchHoliday.findFirst({ where: { branchId: branch.id, date: new Date(`${date}T00:00:00.000Z`) } }),
    ]);
    const branchIntervals = holiday
      ? holiday.closed
        ? []
        : this.readIntervals(holiday.intervals)
      : hours?.open
        ? this.readIntervals(hours.intervals)
        : [];
    if (branchIntervals.length === 0) {
      return { branchId: branch.id, hasAvailability: false, earliestSlotAt: null };
    }
    const shifts = await this.prisma.salonOwnerStaffShift.findMany({
      where: {
        branchId: branch.id,
        staff: {
          status: SalonOwnerStatus.ACTIVE,
          OR: [{ skills: { some: { serviceId: service.id } } }, { eligibleFor: { some: { serviceId: service.id } } }],
        },
      },
    });
    const staffIds = shifts.map((shift) => shift.staffId);
    if (staffIds.length === 0) {
      return { branchId: branch.id, hasAvailability: false, earliestSlotAt: null };
    }
    const [appointments, leaveBlocks] = await Promise.all([
      this.prisma.salonOwnerAppointmentLine.findMany({
        where: {
          staffId: { in: staffIds },
          startsAt: { lt: range.lt },
          endsAt: { gt: range.gte },
          appointment: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        },
        select: { staffId: true, startsAt: true, endsAt: true },
      }),
      this.prisma.salonOwnerStaffLeaveBlock.findMany({
        where: { branchId: branch.id, staffId: { in: staffIds }, startsAt: { lt: range.lt }, endsAt: { gt: range.gte } },
        select: { staffId: true, startsAt: true, endsAt: true },
      }),
    ]);
    const durationMinutes = service.durationMinutes + service.bufferMinutes;
    const earliestSlotAt = this.findEarliestSlot({
      branchTimezone: branch.timezone,
      date,
      dayOfWeek,
      branchIntervals,
      shifts,
      appointments,
      leaveBlocks,
      durationMinutes,
    });
    return { branchId: branch.id, hasAvailability: Boolean(earliestSlotAt), earliestSlotAt };
  }

  private findEarliestSlot(input: {
    readonly branchTimezone: string;
    readonly date: string;
    readonly dayOfWeek: number;
    readonly branchIntervals: readonly TimeInterval[];
    readonly shifts: readonly StaffShiftRecord[];
    readonly appointments: readonly AppointmentLineWindow[];
    readonly leaveBlocks: readonly LeaveBlockWindow[];
    readonly durationMinutes: number;
  }): string | null {
    for (const shift of input.shifts) {
      const shiftDay = this.readShiftDays(shift.days).find((day) => day.dayOfWeek === input.dayOfWeek);
      if (!shiftDay) {
        continue;
      }
      for (const branchInterval of input.branchIntervals) {
        for (const staffInterval of shiftDay.intervals) {
          const startMinute = Math.max(this.minutes(branchInterval.start), this.minutes(staffInterval.start));
          const endMinute = Math.min(this.minutes(branchInterval.end), this.minutes(staffInterval.end));
          for (let minute = startMinute; minute + input.durationMinutes <= endMinute; minute += 15) {
            const startsAt = this.localDateMinuteToUtc(input.date, minute, input.branchTimezone);
            const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
            if (!this.hasConflict(shift.staffId, startsAt, endsAt, input.appointments, input.leaveBlocks)) {
              return toIso(startsAt);
            }
          }
        }
      }
    }
    return null;
  }

  private hasConflict(
    staffId: string,
    startsAt: Date,
    endsAt: Date,
    appointments: readonly AppointmentLineWindow[],
    leaveBlocks: readonly LeaveBlockWindow[],
  ): boolean {
    return [...appointments, ...leaveBlocks].some(
      (block) => block.staffId === staffId && startsAt < block.endsAt && endsAt > block.startsAt,
    );
  }

  private earliestSlot(signals: readonly BranchAvailabilitySignal[]): string | null {
    return signals
      .map((signal) => signal.earliestSlotAt)
      .filter((slot): slot is string => Boolean(slot))
      .sort()[0] ?? null;
  }

  private nextBookableDate(timezone: string): string {
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + 1);
    return this.localDateInTimeZone(next, timezone);
  }

  private readIntervals(value: Prisma.JsonValue): readonly TimeInterval[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((interval) => {
      if (!this.isJsonObject(interval)) {
        return [];
      }
      const start = interval['start'];
      const end = interval['end'];
      return typeof start === 'string' && typeof end === 'string' && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)
        ? [{ start, end }]
        : [];
    });
  }

  private readShiftDays(value: Prisma.JsonValue): readonly StaffShiftDay[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((day) => {
      if (!this.isJsonObject(day)) {
        return [];
      }
      const dayOfWeek = Number(day['dayOfWeek']);
      const intervals = day['intervals'];
      return Number.isInteger(dayOfWeek) && intervals !== undefined ? [{ dayOfWeek, intervals: this.readIntervals(intervals) }] : [];
    });
  }

  private isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private minutes(value: string): number {
    const [hours, minutes] = value.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }

  private dayOfWeek(date: string): number {
    const [year, month, day] = date.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  private dateRangeUtc(date: string, timezone: string): { readonly gte: Date; readonly lt: Date } {
    const [year, month, day] = date.split('-').map((part) => Number(part));
    return {
      gte: this.zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 }, timezone),
      lt: this.zonedDateTimeToUtc({ year, month, day: day + 1, hour: 0, minute: 0, second: 0 }, timezone),
    };
  }

  private localDateMinuteToUtc(date: string, minuteOfDay: number, timezone: string): Date {
    const [year, month, day] = date.split('-').map((part) => Number(part));
    return this.zonedDateTimeToUtc(
      { year, month, day, hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60, second: 0 },
      timezone,
    );
  }

  private zonedDateTimeToUtc(parts: DateTimeParts, timezone: string): Date {
    const targetUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    let utcMillis = targetUtc;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const offset = this.timezoneOffsetMs(new Date(utcMillis), timezone);
      const nextUtcMillis = targetUtc - offset;
      if (nextUtcMillis === utcMillis) {
        break;
      }
      utcMillis = nextUtcMillis;
    }
    return new Date(utcMillis);
  }

  private timezoneOffsetMs(date: Date, timezone: string): number {
    const parts = this.zonedParts(date, timezone);
    const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return zonedAsUtc - date.getTime();
  }

  private localDateInTimeZone(date: Date, timezone: string): string {
    const parts = this.zonedParts(date, timezone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }

  private zonedParts(date: Date, timezone: string): DateTimeParts {
    const values = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .reduce<Record<string, number>>((parts, part) => {
        if (part.type !== 'literal') {
          parts[part.type] = Number(part.value);
        }
        return parts;
      }, {});
    return {
      year: values['year'],
      month: values['month'],
      day: values['day'],
      hour: values['hour'],
      minute: values['minute'],
      second: values['second'],
    };
  }

  private page<T>(items: readonly T[], limit = defaultLimit): PublicPage<T> {
    return { items, page: { limit, nextCursor: null, hasMore: false } };
  }
}
