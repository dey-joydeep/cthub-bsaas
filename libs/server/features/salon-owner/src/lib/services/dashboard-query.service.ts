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
type InvoiceSummary = Pick<Prisma.SalonOwnerInvoiceGetPayload<object>, 'id' | 'branchId' | 'customerId' | 'status' | 'total' | 'paidAmount' | 'dueAmount'>;
type ProductStockRecord = Prisma.SalonOwnerProductGetPayload<{ include: { stockMovements: true } }>;

function decimal(value: string | Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function parseBusinessDate(value?: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new UnprocessableEntityException(invalidDateMessage);
  }
  return value;
}

function dateRangeUtc(date: string): { readonly gte: Date; readonly lt: Date } {
  const gte = new Date(`${date}T00:00:00.000Z`);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

@Injectable()
export class DashboardQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnerDashboard(context: SalonOwnerRequestContext, branchId?: string, date?: string): Promise<DashboardModel> {
    const businessDate = parseBusinessDate(date);
    const branch = await this.resolveBranch(context, branchId);
    const range = dateRangeUtc(businessDate);
    const [appointments, invoices, lowStock] = await Promise.all([
      this.prisma.salonOwnerAppointment.findMany({
        where: { branchId: branch.id, createdAt: range },
        select: { status: true, estimatedWaitMinutes: true },
      }),
      this.findRevenueInvoices(branch.id),
      this.findLowStock(branch),
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
      branchId: branch.id,
      appointments: appointmentCounts,
      revenue: this.mapRevenue(invoices),
      inventoryAlerts: lowStock.length,
    };
  }

  async listDashboardAlerts(context: SalonOwnerRequestContext, branchId?: string): Promise<PagedResult<DashboardAlertModel>> {
    const branch = await this.resolveBranch(context, branchId);
    const [lowStock, dues] = await Promise.all([this.findLowStock(branch), this.findPendingDues(branch.id)]);
    const alerts: DashboardAlertModel[] = [
      ...lowStock.map((product) => ({
        id: `low-stock:${branch.id}:${product.id}`,
        kind: 'LOW_STOCK' as const,
        severity: 'WARNING' as const,
        branchId: branch.id,
        entityId: product.id,
        message: `${product.name} is at or below reorder point.`,
      })),
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

  private async resolveBranch(context: SalonOwnerRequestContext, branchId?: string): Promise<BranchRecord> {
    const tenantId = this.requireTenantId(context);
    const branch = await this.prisma.salonBranch.findFirst({
      where: { ...(branchId ? { id: branchId } : {}), business: { tenantId } },
      orderBy: { createdAt: 'asc' },
    });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async findRevenueInvoices(branchId: string): Promise<InvoiceSummary[]> {
    return this.prisma.salonOwnerInvoice.findMany({
      where: { branchId, status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] } },
      select: { id: true, branchId: true, customerId: true, status: true, total: true, paidAmount: true, dueAmount: true },
    });
  }

  private async findPendingDues(branchId: string): Promise<InvoiceSummary[]> {
    return this.prisma.salonOwnerInvoice.findMany({
      where: { branchId, dueAmount: { gt: 0 } },
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
