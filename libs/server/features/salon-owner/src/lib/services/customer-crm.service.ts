import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import { CommunicationPreferencesInputDto, CustomerInputDto, CustomerNoteInputDto } from '../dto/customer-crm.dto';
import { PagedResult, SalonOwnerRequestContext } from '../models/salon-owner-settings.models';
import { CommunicationPreferencesModel, CustomerModel, CustomerNoteModel, CustomerVisitModel } from '../models/customer-crm.models';

const duplicateCustomerMessage = 'error.customer.profile.duplicate';
const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;

type BusinessRecord = Awaited<ReturnType<PrismaService['salonBusiness']['findFirst']>>;
type CustomerRecord = Awaited<ReturnType<PrismaService['salonOwnerCustomer']['findFirstOrThrow']>>;
type CustomerNoteRecord = Awaited<ReturnType<PrismaService['salonOwnerCustomerNote']['create']>>;

function trimRequired(value: string): string {
  return value.trim();
}

function optionalTrim(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function parseBirthDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new UnprocessableEntityException(validationMessage);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date > today) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return date;
}

function isDuplicate(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class CustomerCrmService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCustomers(context: SalonOwnerRequestContext, search?: string): Promise<PagedResult<CustomerModel>> {
    const business = await this.resolveDefaultBusiness(context);
    const normalizedSearch = optionalTrim(search);
    const customers = await this.prisma.salonOwnerCustomer.findMany({
      where: {
        businessId: business.id,
        ...(normalizedSearch
          ? {
              OR: [
                { displayName: { contains: normalizedSearch, mode: 'insensitive' } },
                { phone: { contains: normalizedSearch, mode: 'insensitive' } },
                { email: { contains: normalizedSearch, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.page(customers.map((customer) => this.mapCustomer(customer)));
  }

  async createCustomer(context: SalonOwnerRequestContext, input: CustomerInputDto): Promise<CustomerModel> {
    const business = await this.resolveDefaultBusiness(context);
    try {
      return this.mapCustomer(
        await this.prisma.salonOwnerCustomer.create({
          data: {
            businessId: business.id,
            displayName: trimRequired(input.displayName),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            dateOfBirth: parseBirthDate(input.dateOfBirth),
            consentForMarketing: input.consentForMarketing ?? false,
          },
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateCustomerMessage);
      }
      throw error;
    }
  }

  async getCustomer(context: SalonOwnerRequestContext, customerId: string): Promise<CustomerModel> {
    return this.mapCustomer(await this.findCustomerInScope(context, customerId));
  }

  async updateCustomer(context: SalonOwnerRequestContext, customerId: string, input: CustomerInputDto): Promise<CustomerModel> {
    await this.findCustomerInScope(context, customerId);
    try {
      return this.mapCustomer(
        await this.prisma.salonOwnerCustomer.update({
          where: { id: customerId },
          data: {
            displayName: trimRequired(input.displayName),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            dateOfBirth: parseBirthDate(input.dateOfBirth),
            consentForMarketing: input.consentForMarketing ?? false,
          },
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateCustomerMessage);
      }
      throw error;
    }
  }

  async createCustomerNote(context: SalonOwnerRequestContext, customerId: string, input: CustomerNoteInputDto): Promise<CustomerNoteModel> {
    await this.findCustomerInScope(context, customerId);
    return this.mapNote(
      await this.prisma.salonOwnerCustomerNote.create({
        data: {
          customerId,
          body: trimRequired(input.body),
          visibility: input.visibility,
        },
      }),
    );
  }

  async updateCustomerCommunicationPreferences(
    context: SalonOwnerRequestContext,
    customerId: string,
    input: CommunicationPreferencesInputDto,
  ): Promise<CommunicationPreferencesModel> {
    await this.findCustomerInScope(context, customerId);
    const customer = await this.prisma.salonOwnerCustomer.update({
      where: { id: customerId },
      data: {
        smsEnabled: input.smsEnabled,
        emailEnabled: input.emailEnabled,
        whatsappEnabled: input.whatsappEnabled,
      },
    });
    return this.mapPreferences(customer);
  }

  async getCustomerVisitHistory(context: SalonOwnerRequestContext, customerId: string): Promise<PagedResult<CustomerVisitModel>> {
    await this.findCustomerInScope(context, customerId);
    return this.page([]);
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async resolveDefaultBusiness(context: SalonOwnerRequestContext): Promise<NonNullable<BusinessRecord>> {
    const tenantId = this.requireTenantId(context);
    const business = await this.prisma.salonBusiness.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    if (!business) {
      throw new NotFoundException(notFoundMessage);
    }
    return business;
  }

  private async findCustomerInScope(context: SalonOwnerRequestContext, customerId: string): Promise<CustomerRecord> {
    const tenantId = this.requireTenantId(context);
    const customer = await this.prisma.salonOwnerCustomer.findFirst({
      where: {
        id: customerId,
        business: { tenantId },
      },
    });
    if (!customer) {
      throw new NotFoundException(notFoundMessage);
    }
    return customer;
  }

  private mapCustomer(customer: CustomerRecord): CustomerModel {
    return {
      id: customer.id,
      displayName: customer.displayName,
      phone: customer.phone,
      ...(customer.email ? { email: customer.email } : {}),
      ...(customer.dateOfBirth ? { dateOfBirth: customer.dateOfBirth.toISOString().slice(0, 10) } : {}),
      consentForMarketing: customer.consentForMarketing,
      createdAt: toIso(customer.createdAt),
      updatedAt: toIso(customer.updatedAt),
    };
  }

  private mapNote(note: CustomerNoteRecord): CustomerNoteModel {
    return {
      id: note.id,
      customerId: note.customerId,
      body: note.body,
      visibility: note.visibility as CustomerNoteModel['visibility'],
      createdAt: toIso(note.createdAt),
    };
  }

  private mapPreferences(customer: CustomerRecord): CommunicationPreferencesModel {
    return {
      customerId: customer.id,
      smsEnabled: customer.smsEnabled,
      emailEnabled: customer.emailEnabled,
      whatsappEnabled: customer.whatsappEnabled,
    };
  }

  private page<T>(items: readonly T[]): PagedResult<T> {
    return {
      items,
      page: {
        limit: items.length,
        nextCursor: null,
        hasMore: false,
      },
    };
  }
}
