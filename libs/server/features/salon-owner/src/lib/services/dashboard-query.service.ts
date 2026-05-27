import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import { DashboardAlertModel, DashboardModel } from '../models/dashboard.models';
import { PagedResult, SalonOwnerRequestContext } from '../models/salon-owner-settings.models';

const invalidDateMessage = 'error.dashboard.filter.date.invalid';
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;

type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type InvoiceSummary = Pick<
  Prisma.SalonOwnerInvoiceGetPayload<object>,
  'id' | 'branchId' | 'customerId' | 'status' | 'total' | 'paidAmount' | 'dueAmount'
>;
type ProductStockRecord = Prisma.SalonOwnerProductGetPayload<{ include: { stockMovements: true } }>;
type DateRange = { readonly gte: Date; readonly lt: Date };
type BranchDateRange = { readonly branchId: string; readonly range: DateRange };

function decimal(value: string | Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function parseBusinessDate(timezone: string, value?: string): string {
  if (!value) {
    return localDateInTimeZone(new Date(), timezone);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new UnprocessableEntityException(invalidDateMessage);
  }
  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) {
    throw new UnprocessableEntityException(invalidDateMessage);
  }
  return value;
}

function dateRangeUtc(date: string, timezone: string): DateRange {
  const [year, month, day] = date.split('-').map((part) => Number(part));
  const gte = zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 }, timezone);
  const lt = zonedDateTimeToUtc({ year, month, day: day + 1, hour: 0, minute: 0, second: 0 }, timezone);
  return { gte, lt };
}

function localDateInTimeZone(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function zonedDateTimeToUtc(
  parts: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
  },
  timezone: string,
): Date {
  const targetUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let utcMillis = targetUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = timezoneOffsetMs(new Date(utcMillis), timezone);
    const nextUtcMillis = targetUtc - offset;
    if (nextUtcMillis === utcMillis) {
      break;
    }
    utcMillis = nextUtcMillis;
  }
  return new Date(utcMillis);
}

function timezoneOffsetMs(date: Date, timezone: string): number {
  const parts = zonedParts(date, timezone);
  const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return zonedAsUtc - date.getTime();
}

function zonedParts(
  date: Date,
  timezone: string,
): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
} {
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

@Injectable()
export class DashboardQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnerDashboard(context: SalonOwnerRequestContext, branchId?: string, date?: string): Promise<DashboardModel> {
    const branches = await this.resolveBranches(context, branchId);
    const businessDate = parseBusinessDate(branches[0].timezone, date);
    const branchRanges = branches.map((branch) => ({ branchId: branch.id, range: dateRangeUtc(businessDate, branch.timezone) }));
    const [appointments, invoices, lowStock] = await Promise.all([
      this.findDashboardAppointments(branchRanges),
      this.findRevenueInvoices(branchRanges),
      Promise.all(branches.map((branch) => this.findLowStock(branch))),
    ]);
    const appointmentCounts = appointments.reduce<Record<string, number>>((counts, appointment) => {
      counts[appointment.status] = (counts[appointment.status] ?? 0) + 1;
      if (appointment.estimatedWaitMinutes !== null) {
        counts['WALK_IN'] = (counts['WALK_IN'] ?? 0) + 1;
      }
      return counts;
    }, {});

    return {
      businessDate,
      branchId: branchId ? branches[0].id : null,
      appointments: appointmentCounts,
      revenue: this.mapRevenue(invoices),
      inventoryAlerts: lowStock.flat().length,
    };
  }

  async listDashboardAlerts(context: SalonOwnerRequestContext, branchId?: string): Promise<PagedResult<DashboardAlertModel>> {
    const branches = await this.resolveBranches(context, branchId);
    const [lowStock, dues] = await Promise.all([
      Promise.all(branches.map((branch) => this.findLowStock(branch))),
      this.findPendingDues(branches.map((branch) => branch.id)),
    ]);
    const alerts: DashboardAlertModel[] = [
      ...lowStock.flatMap((products, index) =>
        products.map((product) => ({
          id: `low-stock:${branches[index].id}:${product.id}`,
          kind: 'LOW_STOCK' as const,
          severity: 'WARNING' as const,
          branchId: branches[index].id,
          entityId: product.id,
          message: `${product.name} is at or below reorder point.`,
        })),
      ),
      ...dues.map((invoice) => ({
        id: `pending-due:${invoice.id}`,
        kind: 'PENDING_DUE' as const,
        severity: 'INFO' as const,
        branchId: invoice.branchId,
        entityId: invoice.id,
        amount: money(invoice.dueAmount),
        message: `Invoice ${invoice.id} has pending dues.`,
      })),
    ];
    return { items: alerts, page: { limit: alerts.length, nextCursor: null, hasMore: false } };
  }

  private async resolveBranches(context: SalonOwnerRequestContext, branchId?: string): Promise<readonly BranchRecord[]> {
    const tenantId = this.requireTenantId(context);
    if (branchId) {
      const branch = await this.prisma.salonBranch.findFirst({
        where: { id: branchId, business: { tenantId } },
        orderBy: { createdAt: 'asc' },
      });
      if (!branch) {
        throw new NotFoundException(notFoundMessage);
      }
      return [branch];
    }
    const branches = await this.prisma.salonBranch.findMany({
      where: { business: { tenantId } },
      orderBy: { createdAt: 'asc' },
    });
    if (branches.length === 0) {
      throw new NotFoundException(notFoundMessage);
    }
    return branches;
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async findDashboardAppointments(branchRanges: readonly BranchDateRange[]) {
    return this.prisma.salonOwnerAppointment.findMany({
      where: {
        OR: branchRanges.map((branchRange) => ({
          branchId: branchRange.branchId,
          lines: { some: { startsAt: branchRange.range } },
        })),
      },
      select: { status: true, estimatedWaitMinutes: true },
    });
  }

  private async findRevenueInvoices(branchRanges: readonly BranchDateRange[]): Promise<InvoiceSummary[]> {
    return this.prisma.salonOwnerInvoice.findMany({
      where: {
        status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] },
        OR: branchRanges.map((branchRange) => ({ branchId: branchRange.branchId, createdAt: branchRange.range })),
      },
      select: { id: true, branchId: true, customerId: true, status: true, total: true, paidAmount: true, dueAmount: true },
    });
  }

  private async findPendingDues(branchIds: readonly string[]): Promise<InvoiceSummary[]> {
    return this.prisma.salonOwnerInvoice.findMany({
      where: { branchId: { in: [...branchIds] }, dueAmount: { gt: 0 } },
      select: { id: true, branchId: true, customerId: true, status: true, total: true, paidAmount: true, dueAmount: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async findLowStock(branch: BranchRecord): Promise<ProductStockRecord[]> {
    const products = await this.prisma.salonOwnerProduct.findMany({
      where: { businessId: branch.businessId, status: 'ACTIVE', reorderPoint: { not: null } },
      include: { stockMovements: { where: { branchId: branch.id } } },
      orderBy: { name: 'asc' },
    });
    return products.filter((product) => {
      const current = product.stockMovements.reduce((sum, movement) => sum.plus(movement.quantity), decimal(0));
      return product.reorderPoint ? current.lte(product.reorderPoint) : false;
    });
  }

  private mapRevenue(invoices: readonly InvoiceSummary[]) {
    const summary = invoices.reduce(
      (summary, invoice) => ({
        gross: summary.gross.plus(invoice.total),
        paid: summary.paid.plus(invoice.paidAmount),
        due: summary.due.plus(invoice.dueAmount),
      }),
      { gross: decimal(0), paid: decimal(0), due: decimal(0) },
    );
    return { gross: money(summary.gross), paid: money(summary.paid), due: money(summary.due) };
  }
}
