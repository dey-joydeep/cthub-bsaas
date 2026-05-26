import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, SalonOwnerAppointmentStatus as PrismaAppointmentStatus } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import { AppointmentInputDto, AppointmentLineInputDto, ReasonInputDto, RescheduleAppointmentInputDto, WalkInAppointmentInputDto } from '../dto/appointment-scheduling.dto';
import { AppointmentDayBoardModel, AppointmentLineModel, AppointmentModel, AppointmentStatus, AvailableSlotModel } from '../models/appointment-scheduling.models';
import { PagedResult, SalonOwnerRequestContext } from '../models/salon-owner-settings.models';

const conflictMessage = 'error.appointment.booking.staff_conflict';
const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;

const appointmentInclude = { lines: true } as const;
type AppointmentRecord = Prisma.SalonOwnerAppointmentGetPayload<{ include: typeof appointmentInclude }>;
type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type ServiceRecord = Awaited<ReturnType<PrismaService['salonOwnerService']['findFirstOrThrow']>>;
type StaffRecord = Awaited<ReturnType<PrismaService['salonOwnerStaff']['findFirstOrThrow']>>;

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

function dayRange(date: string): { startsAt: Date; endsAt: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new UnprocessableEntityException(validationMessage);
  }
  const startsAt = new Date(`${date}T00:00:00.000Z`);
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 1);
  return { startsAt, endsAt };
}

@Injectable()
export class AppointmentSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointmentDayBoard(context: SalonOwnerRequestContext, branchId: string, date: string): Promise<AppointmentDayBoardModel> {
    await this.findBranchInScope(context, branchId);
    const range = dayRange(date);
    const appointments = await this.prisma.salonOwnerAppointment.findMany({
      where: {
        branchId,
        lines: { some: { startsAt: { gte: range.startsAt, lt: range.endsAt } } },
      },
      include: appointmentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return { branchId, date, appointments: appointments.map((appointment) => this.mapAppointment(appointment)) };
  }

  async findAppointmentSlots(
    context: SalonOwnerRequestContext,
    branchId: string,
    serviceIds: readonly string[],
    date: string,
  ): Promise<PagedResult<AvailableSlotModel>> {
    const branch = await this.findBranchInScope(context, branchId);
    const services = await this.findServicesInBusiness(branch.businessId, serviceIds);
    const staff = await this.prisma.salonOwnerStaff.findMany({
      where: { businessId: branch.businessId, branches: { some: { branchId } }, status: 'ACTIVE' },
      orderBy: { displayName: 'asc' },
    });
    const startsAt = new Date(`${date}T09:00:00.000Z`);
    const duration = services.reduce((total, service) => total + service.durationMinutes + service.bufferMinutes, 0);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);
    return this.page(staff.map((member) => ({ staffId: member.id, startsAt: toIso(startsAt), endsAt: toIso(endsAt) })));
  }

  async createAppointment(context: SalonOwnerRequestContext, input: AppointmentInputDto): Promise<AppointmentModel> {
    return this.createAppointmentInternal(context, input, {});
  }

  async createWalkInAppointment(context: SalonOwnerRequestContext, input: WalkInAppointmentInputDto): Promise<AppointmentModel> {
    return this.createAppointmentInternal(context, input, { estimatedWaitMinutes: input.estimatedWaitMinutes ?? 0 });
  }

  async getAppointment(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.mapAppointment(await this.findAppointmentInScope(context, appointmentId));
  }

  async rescheduleAppointment(
    context: SalonOwnerRequestContext,
    appointmentId: string,
    input: RescheduleAppointmentInputDto,
  ): Promise<AppointmentModel> {
    const appointment = await this.findAppointmentInScope(context, appointmentId);
    await this.assertLinesAvailable(appointment.branchId, input.lines, appointment.id);
    const lineData = await this.buildLineData(appointment.branchId, input.lines);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerAppointmentLine.deleteMany({ where: { appointmentId } });
      await tx.salonOwnerAppointmentLine.createMany({ data: lineData.map((line) => ({ ...line, appointmentId })) });
      return tx.salonOwnerAppointment.update({
        where: { id: appointmentId },
        data: { rescheduleReason: input.reason },
        include: appointmentInclude,
      });
    });
    return this.mapAppointment(updated);
  }

  async confirmAppointment(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'CONFIRMED');
  }

  async cancelAppointment(context: SalonOwnerRequestContext, appointmentId: string, input: ReasonInputDto): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'CANCELLED', { cancellationReason: input.reason });
  }

  async markAppointmentNoShow(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'NO_SHOW');
  }

  async markAppointmentArrived(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'ARRIVED');
  }

  async startAppointmentService(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'IN_SERVICE');
  }

  async completeAppointment(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentModel> {
    return this.transition(context, appointmentId, 'COMPLETED');
  }

  private async createAppointmentInternal(
    context: SalonOwnerRequestContext,
    input: AppointmentInputDto,
    extra: Pick<Prisma.SalonOwnerAppointmentUncheckedCreateInput, 'estimatedWaitMinutes'>,
  ): Promise<AppointmentModel> {
    const branch = await this.findBranchInScope(context, input.branchId);
    await this.findCustomerInBusiness(branch.businessId, input.customerId);
    await this.assertLinesAvailable(branch.id, input.lines);
    const lineData = await this.buildLineData(branch.id, input.lines);
    const appointment = await this.prisma.salonOwnerAppointment.create({
      data: {
        branchId: branch.id,
        customerId: input.customerId,
        notes: input.notes?.trim() || undefined,
        ...extra,
        lines: { create: lineData },
      },
      include: appointmentInclude,
    });
    return this.mapAppointment(appointment);
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async findBranchInScope(context: SalonOwnerRequestContext, branchId: string): Promise<BranchRecord> {
    const tenantId = this.requireTenantId(context);
    const branch = await this.prisma.salonBranch.findFirst({ where: { id: branchId, business: { tenantId } } });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private async findAppointmentInScope(context: SalonOwnerRequestContext, appointmentId: string): Promise<AppointmentRecord> {
    const tenantId = this.requireTenantId(context);
    const appointment = await this.prisma.salonOwnerAppointment.findFirst({
      where: { id: appointmentId, branch: { business: { tenantId } } },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException(notFoundMessage);
    }
    return appointment;
  }

  private async findCustomerInBusiness(businessId: string, customerId: string): Promise<void> {
    const customer = await this.prisma.salonOwnerCustomer.findFirst({ where: { id: customerId, businessId } });
    if (!customer) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async findServicesInBusiness(businessId: string, serviceIds: readonly string[]): Promise<ServiceRecord[]> {
    const ids = [...new Set(serviceIds)];
    const services = await this.prisma.salonOwnerService.findMany({ where: { id: { in: ids }, businessId, status: 'ACTIVE' } });
    if (services.length !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
    return services;
  }

  private async findStaffInBusiness(businessId: string, staffIds: readonly string[]): Promise<StaffRecord[]> {
    const ids = [...new Set(staffIds)];
    const staff = await this.prisma.salonOwnerStaff.findMany({ where: { id: { in: ids }, businessId, status: 'ACTIVE' } });
    if (staff.length !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
    return staff;
  }

  private async buildLineData(branchId: string, lines: readonly AppointmentLineInputDto[]): Promise<Prisma.SalonOwnerAppointmentLineUncheckedCreateWithoutAppointmentInput[]> {
    const branch = await this.prisma.salonBranch.findFirstOrThrow({ where: { id: branchId } });
    const services = await this.findServicesInBusiness(branch.businessId, lines.map((line) => line.serviceId));
    const staff = await this.findStaffInBusiness(branch.businessId, lines.map((line) => line.staffId));
    return lines.map((line) => {
      const service = services.find((candidate) => candidate.id === line.serviceId);
      const member = staff.find((candidate) => candidate.id === line.staffId);
      if (!service || !member) {
        throw new NotFoundException(notFoundMessage);
      }
      const startsAt = parseIso(line.startsAt);
      const endsAt = new Date(startsAt.getTime() + (service.durationMinutes + service.bufferMinutes) * 60_000);
      return {
        serviceId: service.id,
        staffId: member.id,
        startsAt,
        endsAt,
        serviceName: service.name,
        staffName: member.displayName,
        durationMinutes: service.durationMinutes,
      };
    });
  }

  private async assertLinesAvailable(branchId: string, lines: readonly AppointmentLineInputDto[], excludeAppointmentId?: string): Promise<void> {
    const builtLines = await this.buildLineData(branchId, lines);
    for (const line of builtLines) {
      const conflict = await this.prisma.salonOwnerAppointmentLine.findFirst({
        where: {
          staffId: line.staffId,
          appointmentId: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          appointment: { branchId, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
          startsAt: { lt: line.endsAt },
          endsAt: { gt: line.startsAt },
        },
      });
      if (conflict) {
        throw new ConflictException(conflictMessage);
      }
    }
  }

  private async transition(
    context: SalonOwnerRequestContext,
    appointmentId: string,
    status: AppointmentStatus,
    data: Partial<Prisma.SalonOwnerAppointmentUncheckedUpdateInput> = {},
  ): Promise<AppointmentModel> {
    await this.findAppointmentInScope(context, appointmentId);
    const appointment = await this.prisma.salonOwnerAppointment.update({
      where: { id: appointmentId },
      data: { ...data, status: status as PrismaAppointmentStatus },
      include: appointmentInclude,
    });
    return this.mapAppointment(appointment);
  }

  private mapAppointment(appointment: AppointmentRecord): AppointmentModel {
    return {
      id: appointment.id,
      branchId: appointment.branchId,
      customerId: appointment.customerId,
      status: appointment.status,
      lines: appointment.lines.map((line) => this.mapLine(line)),
      ...(appointment.notes ? { notes: appointment.notes } : {}),
      ...(appointment.estimatedWaitMinutes !== null ? { estimatedWaitMinutes: appointment.estimatedWaitMinutes } : {}),
      createdAt: toIso(appointment.createdAt),
      updatedAt: toIso(appointment.updatedAt),
    };
  }

  private mapLine(line: AppointmentRecord['lines'][number]): AppointmentLineModel {
    return {
      id: line.id,
      serviceId: line.serviceId,
      staffId: line.staffId,
      startsAt: toIso(line.startsAt),
      endsAt: toIso(line.endsAt),
      serviceName: line.serviceName,
      staffName: line.staffName,
      durationMinutes: line.durationMinutes,
    };
  }

  private page<T>(items: readonly T[]): PagedResult<T> {
    return { items, page: { limit: items.length, nextCursor: null, hasMore: false } };
  }
}
