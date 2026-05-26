import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SalonOwnerInvoiceStatus as PrismaInvoiceStatus, SalonOwnerStatus as PrismaSalonOwnerStatus } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import { FinalizeInvoiceInputDto, InvoiceInputDto, PaymentInputDto, ProductInputDto, StockMovementInputDto } from '../dto/pos-inventory.dto';
import { PagedResult, SalonOwnerRequestContext } from '../models/salon-owner-settings.models';
import { BranchStockModel, InvoiceModel, ProductModel, StockMovementModel } from '../models/pos-inventory.models';

const duplicateProductMessage = 'error.product.sku.duplicate';
const totalMismatchMessage = 'error.pos.invoice.total_mismatch';
const invalidInvoiceStatusMessage = 'error.pos.invoice.status_invalid';
const negativeStockMessage = 'error.inventory.stock.negative_not_allowed';
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;

const invoiceInclude = { lines: true, payments: true } as const;
type BusinessRecord = Awaited<ReturnType<PrismaService['salonBusiness']['findFirst']>>;
type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type InvoiceRecord = Prisma.SalonOwnerInvoiceGetPayload<{ include: typeof invoiceInclude }>;
type NormalizedInvoiceLineInput = {
  type: string;
  referenceId: string;
  description: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};
type ProductStockRecord = Prisma.SalonOwnerProductGetPayload<{ include: { stockMovements: true } }>;
type ProductRecord = Awaited<ReturnType<PrismaService['salonOwnerProduct']['create']>>;
type StockMovementRecord = Awaited<ReturnType<PrismaService['salonOwnerStockMovement']['create']>>;

function trimRequired(value: string): string {
  return value.trim();
}

function optionalTrim(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function decimal(value: string | Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function quantity(value: Prisma.Decimal): string {
  return value.toFixed(3).replace(/\.?0+$/, '');
}

function toIso(value: Date): string {
  return value.toISOString();
}

function isDuplicate(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class PosInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckoutContext(context: SalonOwnerRequestContext, appointmentId?: string, customerId?: string) {
    const business = await this.resolveDefaultBusiness(context);
    return { businessId: business.id, appointmentId: appointmentId ?? null, customerId: customerId ?? null };
  }

  async createInvoice(context: SalonOwnerRequestContext, input: InvoiceInputDto): Promise<InvoiceModel> {
    const branch = await this.findBranchInScope(context, input.branchId);
    await this.findCustomerInBusiness(branch.businessId, input.customerId);
    if (input.appointmentId) {
      await this.findAppointmentInBranch(branch.id, input.appointmentId);
    }
    const lines = this.normalizeInvoiceLines(input);
    const total = lines.reduce((sum, line) => sum.plus(line.lineTotal), decimal(0));
    const invoice = await this.prisma.salonOwnerInvoice.create({
      data: {
        branchId: branch.id,
        customerId: input.customerId,
        appointmentId: input.appointmentId,
        subtotal: total,
        total,
        dueAmount: total,
        lines: { create: lines },
      },
      include: invoiceInclude,
    });
    return this.mapInvoice(invoice);
  }

  async getInvoice(context: SalonOwnerRequestContext, invoiceId: string): Promise<InvoiceModel> {
    return this.mapInvoice(await this.findInvoiceInScope(context, invoiceId));
  }

  async finalizeInvoice(context: SalonOwnerRequestContext, invoiceId: string, input: FinalizeInvoiceInputDto): Promise<InvoiceModel> {
    const invoice = await this.findInvoiceInScope(context, invoiceId);
    if (invoice.status !== 'DRAFT') {
      throw new ConflictException(invalidInvoiceStatusMessage);
    }
    if (!invoice.total.equals(decimal(input.confirmedTotal))) {
      throw new ConflictException(totalMismatchMessage);
    }
    const productLines = invoice.lines.filter((line) => line.type === 'PRODUCT');
    for (const line of productLines) {
      await this.assertStockBalanceAllows(invoice.branchId, line.referenceId, line.quantity.negated());
    }
    return this.mapInvoice(
      await this.prisma.$transaction(async (tx) => {
        for (const line of productLines) {
          await tx.salonOwnerStockMovement.create({
            data: {
              branchId: invoice.branchId,
              productId: line.referenceId,
              quantity: line.quantity.negated(),
              reason: 'SALE',
              note: `Invoice ${invoice.id}`,
            },
          });
        }
        return tx.salonOwnerInvoice.update({
          where: { id: invoiceId },
          data: { status: 'FINALIZED' },
          include: invoiceInclude,
        });
      }),
    );
  }

  async captureInvoicePayment(context: SalonOwnerRequestContext, invoiceId: string, input: PaymentInputDto): Promise<InvoiceModel> {
    const invoice = await this.findInvoiceInScope(context, invoiceId);
    const amount = decimal(input.amount);
    const paidAmount = invoice.paidAmount.plus(amount);
    const dueAmount = Prisma.Decimal.max(invoice.total.minus(paidAmount), decimal(0));
    const status: PrismaInvoiceStatus = dueAmount.equals(0) ? 'PAID' : 'PARTIALLY_PAID';
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerInvoicePayment.create({
        data: {
          invoiceId,
          amount,
          method: input.method,
          receivedAt: new Date(input.receivedAt),
          reference: optionalTrim(input.reference),
        },
      });
      return tx.salonOwnerInvoice.update({
        where: { id: invoiceId },
        data: { paidAmount, dueAmount, status },
        include: invoiceInclude,
      });
    });
    return this.mapInvoice(updated);
  }

  async listPendingDues(context: SalonOwnerRequestContext, branchId?: string): Promise<PagedResult<InvoiceModel>> {
    if (branchId) {
      await this.findBranchInScope(context, branchId);
    }
    const tenantId = this.requireTenantId(context);
    const invoices = await this.prisma.salonOwnerInvoice.findMany({
      where: { ...(branchId ? { branchId } : {}), dueAmount: { gt: 0 }, branch: { business: { tenantId } } },
      include: invoiceInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return this.page(invoices.map((invoice) => this.mapInvoice(invoice)));
  }

  async listProducts(context: SalonOwnerRequestContext, search?: string): Promise<PagedResult<ProductModel>> {
    const business = await this.resolveDefaultBusiness(context);
    const products = await this.prisma.salonOwnerProduct.findMany({
      where: {
        businessId: business.id,
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { name: 'asc' },
    });
    return this.page(products.map((product) => this.mapProduct(product)));
  }

  async createProduct(context: SalonOwnerRequestContext, input: ProductInputDto): Promise<ProductModel> {
    const business = await this.resolveDefaultBusiness(context);
    try {
      return this.mapProduct(
        await this.prisma.salonOwnerProduct.create({
          data: this.normalizeProductInput(business.id, input),
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateProductMessage);
      }
      throw error;
    }
  }

  async getProduct(context: SalonOwnerRequestContext, productId: string): Promise<ProductModel> {
    return this.mapProduct(await this.findProductInScope(context, productId));
  }

  async updateProduct(context: SalonOwnerRequestContext, productId: string, input: ProductInputDto): Promise<ProductModel> {
    const current = await this.findProductInScope(context, productId);
    try {
      return this.mapProduct(
        await this.prisma.salonOwnerProduct.update({
          where: { id: productId },
          data: this.normalizeProductInput(current.businessId, input),
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateProductMessage);
      }
      throw error;
    }
  }

  async listBranchStock(context: SalonOwnerRequestContext, branchId: string): Promise<PagedResult<BranchStockModel>> {
    const branch = await this.findBranchInScope(context, branchId);
    const products = await this.prisma.salonOwnerProduct.findMany({
      where: { businessId: branch.businessId },
      include: { stockMovements: { where: { branchId } } },
      orderBy: { name: 'asc' },
    });
    return this.page(products.map((product) => this.mapBranchStock(branchId, product)));
  }

  async createStockMovement(context: SalonOwnerRequestContext, input: StockMovementInputDto): Promise<StockMovementModel> {
    const branch = await this.findBranchInScope(context, input.branchId);
    await this.findProductInBusiness(branch.businessId, input.productId);
    await this.assertStockBalanceAllows(input.branchId, input.productId, decimal(input.quantity));
    return this.mapStockMovement(
      await this.prisma.salonOwnerStockMovement.create({
        data: this.normalizeStockMovementInput(input),
      }),
    );
  }

  async adjustProductStock(context: SalonOwnerRequestContext, productId: string, input: StockMovementInputDto): Promise<StockMovementModel> {
    if (productId !== input.productId) {
      throw new NotFoundException(notFoundMessage);
    }
    return this.createStockMovement(context, input);
  }

  async listLowStockAlerts(context: SalonOwnerRequestContext, branchId: string): Promise<PagedResult<BranchStockModel>> {
    const stock = await this.listBranchStock(context, branchId);
    return this.page(stock.items.filter((product) => product.lowStock));
  }

  private normalizeInvoiceLines(input: InvoiceInputDto): NormalizedInvoiceLineInput[] {
    return input.lines.map((line) => {
      const qty = decimal(line.quantity);
      const unitPrice = decimal(line.unitPrice);
      return {
        type: line.type,
        referenceId: line.referenceId,
        description: trimRequired(line.description),
        quantity: qty,
        unitPrice,
        lineTotal: qty.mul(unitPrice),
      };
    });
  }

  private normalizeProductInput(businessId: string, input: ProductInputDto): Prisma.SalonOwnerProductUncheckedCreateInput {
    return {
      businessId,
      name: trimRequired(input.name),
      sku: trimRequired(input.sku),
      unit: input.unit,
      retailPrice: decimal(input.retailPrice),
      reorderPoint: input.reorderPoint ? decimal(input.reorderPoint) : undefined,
      status: input.status as PrismaSalonOwnerStatus,
    };
  }

  private normalizeStockMovementInput(input: StockMovementInputDto): Prisma.SalonOwnerStockMovementUncheckedCreateInput {
    return {
      branchId: input.branchId,
      productId: input.productId,
      quantity: decimal(input.quantity),
      reason: input.reason,
      note: optionalTrim(input.note),
    };
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async resolveDefaultBusiness(context: SalonOwnerRequestContext): Promise<NonNullable<BusinessRecord>> {
    const tenantId = this.requireTenantId(context);
    const business = await this.prisma.salonBusiness.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    if (!business) {
      throw new NotFoundException(notFoundMessage);
    }
    return business;
  }

  private async findBranchInScope(context: SalonOwnerRequestContext, branchId: string): Promise<BranchRecord> {
    const tenantId = this.requireTenantId(context);
    const branch = await this.prisma.salonBranch.findFirst({ where: { id: branchId, business: { tenantId } } });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private async findCustomerInBusiness(businessId: string, customerId: string): Promise<void> {
    const customer = await this.prisma.salonOwnerCustomer.findFirst({ where: { id: customerId, businessId } });
    if (!customer) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async findInvoiceInScope(context: SalonOwnerRequestContext, invoiceId: string): Promise<InvoiceRecord> {
    const tenantId = this.requireTenantId(context);
    const invoice = await this.prisma.salonOwnerInvoice.findFirst({
      where: { id: invoiceId, branch: { business: { tenantId } } },
      include: invoiceInclude,
    });
    if (!invoice) {
      throw new NotFoundException(notFoundMessage);
    }
    return invoice;
  }

  private async findProductInScope(context: SalonOwnerRequestContext, productId: string): Promise<ProductRecord> {
    const tenantId = this.requireTenantId(context);
    const product = await this.prisma.salonOwnerProduct.findFirst({ where: { id: productId, business: { tenantId } } });
    if (!product) {
      throw new NotFoundException(notFoundMessage);
    }
    return product;
  }

  private async findProductInBusiness(businessId: string, productId: string): Promise<void> {
    const product = await this.prisma.salonOwnerProduct.findFirst({ where: { id: productId, businessId } });
    if (!product) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async findAppointmentInBranch(branchId: string, appointmentId: string): Promise<void> {
    const appointment = await this.prisma.salonOwnerAppointment.findFirst({ where: { id: appointmentId, branchId } });
    if (!appointment) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async assertStockBalanceAllows(branchId: string, productId: string, quantityChange: Prisma.Decimal): Promise<void> {
    if (quantityChange.gte(0)) {
      return;
    }
    const movements = await this.prisma.salonOwnerStockMovement.findMany({ where: { branchId, productId } });
    const current = this.stockBalance(movements);
    if (current.plus(quantityChange).lt(0)) {
      throw new ConflictException(negativeStockMessage);
    }
  }

  private stockBalance(movements: readonly Pick<StockMovementRecord, 'quantity'>[]): Prisma.Decimal {
    return movements.reduce((sum, movement) => sum.plus(movement.quantity), decimal(0));
  }

  private mapInvoice(invoice: InvoiceRecord): InvoiceModel {
    return {
      id: invoice.id,
      branchId: invoice.branchId,
      customerId: invoice.customerId,
      ...(invoice.appointmentId ? { appointmentId: invoice.appointmentId } : {}),
      status: invoice.status,
      lines: invoice.lines.map((line) => ({
        id: line.id,
        type: line.type,
        referenceId: line.referenceId,
        description: line.description,
        quantity: quantity(line.quantity),
        unitPrice: money(line.unitPrice),
        lineTotal: money(line.lineTotal),
      })),
      subtotal: money(invoice.subtotal),
      taxTotal: money(invoice.taxTotal),
      discountTotal: money(invoice.discountTotal),
      total: money(invoice.total),
      paidAmount: money(invoice.paidAmount),
      dueAmount: money(invoice.dueAmount),
      createdAt: toIso(invoice.createdAt),
      updatedAt: toIso(invoice.updatedAt),
    };
  }

  private mapProduct(product: ProductRecord): ProductModel {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      retailPrice: money(product.retailPrice),
      ...(product.reorderPoint ? { reorderPoint: quantity(product.reorderPoint) } : {}),
      status: product.status,
    };
  }

  private mapBranchStock(branchId: string, product: ProductStockRecord): BranchStockModel {
    const currentQuantity = this.stockBalance(product.stockMovements);
    const lowStock = product.reorderPoint ? currentQuantity.lte(product.reorderPoint) : false;
    return {
      branchId,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      currentQuantity: quantity(currentQuantity),
      ...(product.reorderPoint ? { reorderPoint: quantity(product.reorderPoint) } : {}),
      lowStock,
      status: product.status,
    };
  }

  private mapStockMovement(movement: StockMovementRecord): StockMovementModel {
    return {
      id: movement.id,
      branchId: movement.branchId,
      productId: movement.productId,
      quantity: quantity(movement.quantity),
      reason: movement.reason,
      ...(movement.note ? { note: movement.note } : {}),
      createdAt: toIso(movement.createdAt),
    };
  }

  private page<T>(items: readonly T[]): PagedResult<T> {
    return { items, page: { limit: items.length, nextCursor: null, hasMore: false } };
  }
}
