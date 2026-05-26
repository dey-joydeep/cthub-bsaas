import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, SalonOwnerAppointmentStatus, SalonOwnerStatus } from '@prisma/client';
import { COMMON_MESSAGE_KEYS, type AuthenticatedUser } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import {
  CustomerBookingContextQueryDto,
  CustomerBookingInputDto,
  CustomerCancelInputDto,
  CustomerFavoriteInputDto,
  CustomerRescheduleInputDto,
  CustomerReviewInputDto,
} from '../dto/customer-app.dto';
import {
  CustomerAppointmentModel,
  CustomerBookingContextModel,
  CustomerBookingModel,
  CustomerDashboardModel,
  CustomerFavoriteModel,
  CustomerFavoriteMutationModel,
  CustomerPage,
  CustomerReceiptModel,
  CustomerRewardModel,
  CustomerReviewSubmissionModel,
  CustomerServiceRefModel,
} from '../models/customer-app.models';

const conflictMessage = 'error.customer_app.booking.conflict';
const duplicateReviewMessage = 'error.customer_app.review.duplicate';
const invalidTargetTypeMessage = 'error.customer_app.favorite.target_type_invalid';
const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const defaultLimit = 20;

const appointmentInclude = {
  branch: { include: { business: true, policy: true } },
  lines: { include: { service: true, staff: true }, orderBy: { startsAt: 'asc' as const } },
} as const;
type AppointmentRecord = Prisma.SalonOwnerAppointmentGetPayload<{ include: typeof appointmentInclude }>;
type BranchRecord = Prisma.SalonBranchGetPayload<{ include: { business: true; policy: true } }>;
type ServiceRecord = Prisma.SalonOwnerServiceGetPayload<{ include: { category: true } }>;
type StaffRecord = Prisma.SalonOwnerStaffGetPayload<object>;
type InvoiceRecord = Prisma.SalonOwnerInvoiceGetPayload<{ include: { branch: { include: { business: true } }; customer: true } }>;

function toIso(value: Date): string {
  return value.toISOString();
}

function parseIso(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return parsed;
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function userId(user: AuthenticatedUser): string {
  if (!user.id) {
    throw new ForbiddenException(forbiddenMessage);
  }
  return user.id;
}

function customerEmail(user: AuthenticatedUser): string {
  if (!user.email) {
    throw new ForbiddenException(forbiddenMessage);
  }
  return user.email;
}

@Injectable()
export class CustomerAppService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerDashboard(user: AuthenticatedUser): Promise<CustomerDashboardModel> {
    const now = new Date();
    const appointments = await this.findAppointmentsForUser(user, { take: 20 });
    const upcoming = appointments.find((appointment) => appointment.status !== 'CANCELLED' && this.appointmentStart(appointment) >= now) ?? null;
    const recentVisits = appointments.filter((appointment) => appointment.status === 'COMPLETED').slice(0, 5);
    const receipts = await this.listCustomerReceipts(user, undefined, 5);
    const recommended = await this.prisma.salonBusiness.findMany({ where: { status: SalonOwnerStatus.ACTIVE }, orderBy: { displayName: 'asc' }, take: 5 });
    return {
      upcomingAppointment: upcoming ? this.mapAppointment(upcoming) : null,
      recentVisits: recentVisits.map((appointment) => this.mapAppointment(appointment)),
      rewardSummary: this.rewardSummaryFromReceipts(receipts.items),
      pendingReceipts: receipts.items.filter((receipt) => Number(receipt.due) > 0),
      recommendedSalons: recommended.map((business) => ({ businessId: business.id, name: business.displayName })),
    };
  }

  async getCustomerBookingContext(query: CustomerBookingContextQueryDto): Promise<CustomerBookingContextModel> {
    const business = await this.resolveBusiness(query.businessId);
    const branches = await this.prisma.salonBranch.findMany({
      where: { businessId: business.id, ...(query.branchId ? { id: query.branchId } : {}) },
      include: { business: true, policy: true },
      orderBy: { name: 'asc' },
    });
    const services = await this.prisma.salonOwnerService.findMany({
      where: { businessId: business.id, status: SalonOwnerStatus.ACTIVE, ...(query.serviceId ? { id: query.serviceId } : {}) },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    const staff = await this.prisma.salonOwnerStaff.findMany({
      where: { businessId: business.id, status: SalonOwnerStatus.ACTIVE, ...(query.branchId ? { branches: { some: { branchId: query.branchId } } } : {}) },
      orderBy: { displayName: 'asc' },
    });
    const firstPolicy = branches[0]?.policy;
    const from = new Date();
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 30);
    return {
      salon: { businessId: business.id, name: business.displayName },
      branches: branches.map((branch) => ({ branchId: branch.id, name: branch.name, timezone: branch.timezone, currency: branch.currency })),
      services: services.map((service) => this.mapService(service)),
      staffOptions: staff.map((member) => ({ staffId: member.id, displayName: member.displayName })),
      policySummary: {
        bookingLeadMinutes: firstPolicy?.bookingLeadMinutes ?? 0,
        cancellationCutoffMinutes: firstPolicy?.cancellationCutoffMinutes ?? 0,
      },
      availableDateRange: { from: toIso(from), to: toIso(to) },
    };
  }

  async createCustomerBooking(user: AuthenticatedUser, input: CustomerBookingInputDto): Promise<CustomerBookingModel> {
    const branch = await this.findBranch(input.businessId, input.branchId);
    const customer = await this.findOrCreateCustomer(user, input.businessId);
    const services = await this.findServices(input.businessId, input.serviceIds);
    const staff = await this.resolveStaff(input.businessId, input.branchId, input.staffId);
    const lines = this.buildLines(input.startAt, services, staff);
    await this.assertSlotAvailable(staff.id, asDate(lines[0].startsAt), asDate(lines.at(-1)?.endsAt ?? lines[0].endsAt));
    const appointment = await this.prisma.salonOwnerAppointment.create({
      data: {
        branchId: branch.id,
        customerId: customer.id,
        status: 'BOOKED',
        notes: input.notes?.trim() || undefined,
        lines: { create: lines },
      },
      include: appointmentInclude,
    });
    return this.mapBooking(appointment);
  }

  async listCustomerAppointments(user: AuthenticatedUser, limit = defaultLimit): Promise<CustomerPage<CustomerAppointmentModel>> {
    const appointments = await this.findAppointmentsForUser(user, { take: limit });
    return this.page(appointments.map((appointment) => this.mapAppointment(appointment)), limit);
  }

  async rescheduleCustomerAppointment(user: AuthenticatedUser, appointmentId: string, input: CustomerRescheduleInputDto): Promise<CustomerAppointmentModel> {
    const appointment = await this.findOwnedAppointment(user, appointmentId);
    const services = await this.findServices(
      appointment.branch.businessId,
      appointment.lines.map((line) => line.serviceId),
    );
    const staff = input.staffId ? await this.resolveStaff(appointment.branch.businessId, appointment.branchId, input.staffId) : appointment.lines[0]?.staff;
    if (!staff) {
      throw new NotFoundException(notFoundMessage);
    }
    const lines = this.buildLines(input.startAt, services, staff);
    await this.assertSlotAvailable(staff.id, asDate(lines[0].startsAt), asDate(lines.at(-1)?.endsAt ?? lines[0].endsAt), appointment.id);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerAppointmentLine.deleteMany({ where: { appointmentId } });
      await tx.salonOwnerAppointmentLine.createMany({ data: lines.map((line) => ({ ...line, appointmentId })) });
      return tx.salonOwnerAppointment.update({
        where: { id: appointmentId },
        data: { status: 'BOOKED', rescheduleReason: input.reason?.trim() || undefined },
        include: appointmentInclude,
      });
    });
    return this.mapAppointment(updated);
  }

  async cancelCustomerAppointment(user: AuthenticatedUser, appointmentId: string, input: CustomerCancelInputDto): Promise<{ appointmentId: string; status: string; cancelledAt: string; policyImpact: string }> {
    await this.findOwnedAppointment(user, appointmentId);
    const updated = await this.prisma.salonOwnerAppointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancellationReason: input.notes ? `${input.reason}: ${input.notes}` : input.reason },
    });
    return { appointmentId: updated.id, status: updated.status, cancelledAt: toIso(updated.updatedAt), policyImpact: 'standard_cancellation_policy_applies' };
  }

  async listCustomerFavorites(user: AuthenticatedUser, targetType?: string): Promise<CustomerPage<CustomerFavoriteModel>> {
    const favorites = await this.prisma.customerFavorite.findMany({
      where: { userId: userId(user), ...(targetType ? { targetType } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return this.page(
      favorites.map((favorite) => ({
        targetType: favorite.targetType,
        targetId: favorite.targetId,
        label: favorite.label,
        imageUrl: favorite.imageUrl,
        addedAt: toIso(favorite.createdAt),
      })),
    );
  }

  async upsertCustomerFavorite(user: AuthenticatedUser, targetType: string, targetId: string, input: CustomerFavoriteInputDto): Promise<CustomerFavoriteMutationModel> {
    if (!['salon', 'service'].includes(targetType)) {
      throw new UnprocessableEntityException(invalidTargetTypeMessage);
    }
    const label = await this.favoriteLabel(targetType, targetId);
    if (!input.favorite) {
      await this.prisma.customerFavorite.deleteMany({ where: { userId: userId(user), targetType, targetId } });
      return { targetType, targetId, favorite: false, updatedAt: toIso(new Date()) };
    }
    const favorite = await this.prisma.customerFavorite.upsert({
      where: { userId_targetType_targetId: { userId: userId(user), targetType, targetId } },
      update: { label },
      create: { userId: userId(user), targetType, targetId, label },
    });
    return { targetType: favorite.targetType, targetId: favorite.targetId, favorite: true, updatedAt: toIso(favorite.updatedAt) };
  }

  async listCustomerRewards(user: AuthenticatedUser, businessId?: string): Promise<CustomerPage<CustomerRewardModel>> {
    const receipts = await this.listCustomerReceipts(user, businessId, 100);
    const totalPaid = receipts.items.reduce((sum, receipt) => sum + Number(receipt.paid), 0);
    const points = Math.floor(totalPaid / 10);
    const groupedBusinessId = businessId ?? 'all';
    return this.page([{ businessId: groupedBusinessId, pointsBalance: points, tier: points >= 1000 ? 'gold' : 'standard', availableBenefits: points >= 100 ? ['priority_booking'] : [], expiresAt: null }]);
  }

  async listCustomerReceipts(user: AuthenticatedUser, businessId?: string, limit = defaultLimit): Promise<CustomerPage<CustomerReceiptModel>> {
    const invoices = await this.prisma.salonOwnerInvoice.findMany({
      where: { customer: { email: customerEmail(user) }, ...(businessId ? { branch: { businessId } } : {}) },
      include: { branch: { include: { business: true } }, customer: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return this.page(invoices.map((invoice) => this.mapReceipt(invoice)), limit);
  }

  async submitCustomerReview(user: AuthenticatedUser, input: CustomerReviewInputDto): Promise<CustomerReviewSubmissionModel> {
    await this.findOwnedAppointment(user, input.appointmentId);
    const existing = await this.prisma.customerReview.findUnique({ where: { userId_appointmentId: { userId: userId(user), appointmentId: input.appointmentId } } });
    if (existing) {
      throw new ConflictException(duplicateReviewMessage);
    }
    const review = await this.prisma.customerReview.create({
      data: { userId: userId(user), appointmentId: input.appointmentId, rating: input.rating, comment: input.comment?.trim() || undefined },
    });
    return { reviewId: review.id, status: 'submitted', submittedAt: toIso(review.createdAt), moderationState: review.status };
  }

  private async resolveBusiness(businessId?: string) {
    const business = await this.prisma.salonBusiness.findFirst({ where: { ...(businessId ? { id: businessId } : {}), status: SalonOwnerStatus.ACTIVE }, orderBy: { displayName: 'asc' } });
    if (!business) {
      throw new NotFoundException(notFoundMessage);
    }
    return business;
  }

  private async findBranch(businessId: string, branchId: string): Promise<BranchRecord> {
    const branch = await this.prisma.salonBranch.findFirst({ where: { id: branchId, businessId }, include: { business: true, policy: true } });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private async findOrCreateCustomer(user: AuthenticatedUser, businessId: string) {
    const email = customerEmail(user);
    const existing = await this.prisma.salonOwnerCustomer.findFirst({ where: { businessId, email } });
    if (existing) {
      return existing;
    }
    const phone = typeof user['phone'] === 'string' && user['phone'] ? user['phone'] : email;
    return this.prisma.salonOwnerCustomer.create({
      data: { businessId, displayName: user.name ?? email.split('@')[0] ?? 'Customer', phone, email, consentForMarketing: false },
    });
  }

  private async findServices(businessId: string, serviceIds: readonly string[]): Promise<ServiceRecord[]> {
    const services = await this.prisma.salonOwnerService.findMany({
      where: { id: { in: [...new Set(serviceIds)] }, businessId, status: SalonOwnerStatus.ACTIVE },
      include: { category: true },
    });
    if (services.length !== new Set(serviceIds).size) {
      throw new NotFoundException(notFoundMessage);
    }
    return serviceIds.map((id) => services.find((service) => service.id === id)).filter((service): service is ServiceRecord => Boolean(service));
  }

  private async resolveStaff(businessId: string, branchId: string, staffId?: string): Promise<StaffRecord> {
    const staff = await this.prisma.salonOwnerStaff.findFirst({
      where: { businessId, status: SalonOwnerStatus.ACTIVE, ...(staffId ? { id: staffId } : {}), branches: { some: { branchId } } },
      orderBy: { displayName: 'asc' },
    });
    if (!staff) {
      throw new NotFoundException(notFoundMessage);
    }
    return staff;
  }

  private buildLines(startAt: string, services: readonly ServiceRecord[], staff: Pick<StaffRecord, 'id' | 'displayName'>): Prisma.SalonOwnerAppointmentLineUncheckedCreateWithoutAppointmentInput[] {
    let startsAt = parseIso(startAt);
    return services.map((service) => {
      const endsAt = new Date(startsAt.getTime() + (service.durationMinutes + service.bufferMinutes) * 60_000);
      const line = {
        serviceId: service.id,
        staffId: staff.id,
        startsAt,
        endsAt,
        serviceName: service.name,
        staffName: staff.displayName,
        durationMinutes: service.durationMinutes,
      };
      startsAt = endsAt;
      return line;
    });
  }

  private async assertSlotAvailable(staffId: string, startsAt: Date, endsAt: Date, excludeAppointmentId?: string): Promise<void> {
    const conflict = await this.prisma.salonOwnerAppointmentLine.findFirst({
      where: {
        staffId,
        ...(excludeAppointmentId ? { appointmentId: { not: excludeAppointmentId } } : {}),
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        appointment: { status: { not: SalonOwnerAppointmentStatus.CANCELLED } },
      },
    });
    if (conflict) {
      throw new ConflictException(conflictMessage);
    }
  }

  private async findAppointmentsForUser(user: AuthenticatedUser, options: { take: number }): Promise<AppointmentRecord[]> {
    return this.prisma.salonOwnerAppointment.findMany({
      where: { customer: { email: customerEmail(user) } },
      include: appointmentInclude,
      orderBy: { updatedAt: 'desc' },
      take: options.take,
    });
  }

  private async findOwnedAppointment(user: AuthenticatedUser, appointmentId: string): Promise<AppointmentRecord> {
    const appointment = await this.prisma.salonOwnerAppointment.findFirst({
      where: { id: appointmentId, customer: { email: customerEmail(user) } },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException(notFoundMessage);
    }
    return appointment;
  }

  private mapAppointment(appointment: AppointmentRecord): CustomerAppointmentModel {
    return {
      appointmentId: appointment.id,
      status: appointment.status,
      salon: { businessId: appointment.branch.business.id, name: appointment.branch.business.displayName },
      branch: { branchId: appointment.branch.id, name: appointment.branch.name, timezone: appointment.branch.timezone, currency: appointment.branch.currency },
      startAt: toIso(this.appointmentStart(appointment)),
      endAt: toIso(this.appointmentEnd(appointment)),
      services: appointment.lines.map((line) => ({ serviceId: line.serviceId, name: line.serviceName, durationMinutes: line.durationMinutes, price: money(line.service.basePrice) })),
      actions: appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED' ? ['reschedule', 'cancel'] : [],
    };
  }

  private mapBooking(appointment: AppointmentRecord): CustomerBookingModel {
    return {
      appointmentId: appointment.id,
      status: appointment.status,
      startAt: toIso(this.appointmentStart(appointment)),
      endAt: toIso(this.appointmentEnd(appointment)),
      salon: { businessId: appointment.branch.business.id, name: appointment.branch.business.displayName },
      services: appointment.lines.map((line) => ({ serviceId: line.serviceId, name: line.serviceName, durationMinutes: line.durationMinutes, price: money(line.service.basePrice) })),
      policySnapshot: { cancellationCutoffMinutes: appointment.branch.policy?.cancellationCutoffMinutes ?? 0 },
    };
  }

  private mapService(service: ServiceRecord): CustomerServiceRefModel {
    return { serviceId: service.id, name: service.name, durationMinutes: service.durationMinutes, price: money(service.basePrice) };
  }

  private mapReceipt(invoice: InvoiceRecord): CustomerReceiptModel {
    return {
      receiptId: invoice.id,
      businessName: invoice.branch.business.displayName,
      invoiceNumber: invoice.id,
      total: money(invoice.total),
      paid: money(invoice.paidAmount),
      due: money(invoice.dueAmount),
      currency: invoice.branch.currency,
      issuedAt: toIso(invoice.createdAt),
    };
  }

  private rewardSummaryFromReceipts(receipts: readonly CustomerReceiptModel[]): { pointsBalance: number; tier: string } {
    const pointsBalance = Math.floor(receipts.reduce((sum, receipt) => sum + Number(receipt.paid), 0) / 10);
    return { pointsBalance, tier: pointsBalance >= 1000 ? 'gold' : 'standard' };
  }

  private async favoriteLabel(targetType: string, targetId: string): Promise<string> {
    if (targetType === 'salon') {
      const business = await this.prisma.salonBusiness.findUnique({ where: { id: targetId } });
      if (!business) {
        throw new NotFoundException(notFoundMessage);
      }
      return business.displayName;
    }
    const service = await this.prisma.salonOwnerService.findUnique({ where: { id: targetId } });
    if (!service) {
      throw new NotFoundException(notFoundMessage);
    }
    return service.name;
  }

  private appointmentStart(appointment: AppointmentRecord): Date {
    return appointment.lines[0]?.startsAt ?? appointment.createdAt;
  }

  private appointmentEnd(appointment: AppointmentRecord): Date {
    return appointment.lines.at(-1)?.endsAt ?? appointment.updatedAt;
  }

  private page<T>(items: readonly T[], limit = defaultLimit): CustomerPage<T> {
    return { items, page: { limit, nextCursor: null, hasMore: false } };
  }
}
