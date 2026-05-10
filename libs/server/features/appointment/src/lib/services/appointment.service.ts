import type { AuthUser } from '@cthub-bsaas/server-core';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { AppointmentStatus, isAppointmentStatus } from '@cthub-bsaas/shared';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from '../dto/requests/create-appointment.dto';
import { FilterAppointmentsDto } from '../dto/requests/filter-appointments.dto';
import { UpdateAppointmentDto } from '../dto/requests/update-appointment.dto';
import { AppointmentDetailsDto, AppointmentResponseDto, AppointmentStatsDto, PaginatedAppointmentsDto } from '../dto/responses';
import { APPOINTMENT_REPOSITORY, type AppointmentRepository } from '../repositories/appointment.repository';

// Import DTO interfaces for type safety

/**
 * Type representing a stubbed appointment since the Appointment model is not in the Prisma schema
 */
interface StubAppointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string | null;
  customerId: string;
  staffId?: string | null;
  salonId: string;
  tenantId: string;
  totalPrice: number;
  totalDuration: number;
  isPaid: boolean;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  cancellationReason?: string | null;
  cancellationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any> | null;
}

// Map between our shared status and the database status
const toAppointmentStatus = (status: string): string => {
  if (!isAppointmentStatus(status)) {
    return AppointmentStatus.PENDING;
  }
  return status;
};

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
  ) {
    this.logger.warn('AppointmentService initialized with stubbed implementation - Appointment model not found in schema');
  }

  /**
   * Safely convert Prisma.Decimal to number
   */
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return (value as any).toNumber();
    }
    return 0;
  }

  /**
   * Create a new appointment
   */
  async createAppointment(createAppointmentDto: CreateAppointmentDto, user: AuthUser): Promise<AppointmentDetailsDto> {
    this.logger.warn('Using stubbed implementation for createAppointment - Appointment model not found in schema');

    try {
      // Validate required fields
      if (!createAppointmentDto.customerId) {
        throw new BadRequestException('Customer ID is required');
      }
      if (!createAppointmentDto.salonId) {
        throw new BadRequestException('Salon ID is required');
      }
      if (!createAppointmentDto.services || createAppointmentDto.services.length === 0) {
        throw new BadRequestException('At least one service is required');
      }

      // Log the creation attempt
      this.logger.log(`Creating appointment for customer: ${createAppointmentDto.customerId}`);

      // Get customer details
      const customer = await this.prisma.customer.findUnique({
        where: { id: createAppointmentDto.customerId },
        include: { user: true },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Get salon details
      const salon = await this.prisma.salon.findUnique({
        where: { id: createAppointmentDto.salonId },
        include: { address: true },
      });

      if (!salon) {
        throw new NotFoundException('Salon not found');
      }

      // Calculate total price and duration
      const serviceIds = createAppointmentDto.services.map((s) => s.serviceId);
      const services = await this.prisma.tenantService.findMany({
        where: {
          id: { in: serviceIds },
          tenantId: user.tenantId,
        },
        include: {
          service: true,
        },
      });

      if (services.length !== serviceIds.length) {
        throw new NotFoundException('One or more services not found');
      }

      const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
      const totalDuration = services.reduce((sum, service) => sum + (service.duration || 0), 0);

      // Create a stubbed appointment response
      const now = new Date();
      const endTime = new Date(now.getTime() + totalDuration * 60000); // Convert minutes to ms

      return {
        id: `stub-${Date.now()}`,
        title: services.length > 0 ? services[0].service?.name || 'Appointment' : 'Appointment',
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        status: AppointmentStatus.PENDING,
        notes: createAppointmentDto.notes || null,
        customer: {
          id: customer.id,
          name: [customer.user?.firstName, customer.user?.lastName].filter(Boolean).join(' ') || 'Unknown Customer',
          email: customer.user?.email || '',
          phone: customer.user?.phone || null,
        },
        staff: null, // Will be set if staff is assigned
        services: services.map((service) => ({
          id: service.id,
          name: service.service?.name || 'Unknown Service',
          description: service.service?.description || null,
          price: Number(service.price),
          duration: service.duration || 0,
          staff: null, // Will be set if staff is assigned
        })),
        salon: {
          id: salon.id,
          name: salon.name,
          address: [salon.address?.line1, salon.address?.line2, salon.address?.city, salon.address?.state, salon.address?.postalCode]
            .filter(Boolean)
            .join(', '),
          phone: salon.phone || null,
          email: salon.email || null,
        },
        totalPrice,
        totalDuration,
        isPaid: false,
        paymentMethod: null,
        paymentStatus: null,
        cancellationReason: null,
        cancellationDate: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: {},
      };
    } catch (error) {
      this.logger.error('Error in createAppointment', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create appointment');
    }
  }

  /**
   * Get all appointments with pagination
   */
  async findAllAppointments(filters: FilterAppointmentsDto, user: AuthUser): Promise<PaginatedAppointmentsDto> {
    this.logger.warn('Using stubbed implementation for findAllAppointments - Appointment model not found in schema');

    // Return empty paginated result
    return {
      items: [],
      total: 0,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  /**
   * Get appointment by ID
   */
  async findAppointmentById(id: string): Promise<AppointmentDetailsDto> {
    this.logger.warn(`Using stubbed implementation for findAppointmentById - Appointment model not found in schema (ID: ${id})`);
    throw new NotFoundException('Appointment not found');
  }

  /**
   * Update an appointment
   */
  async updateAppointment(id: string, updateAppointmentDto: UpdateAppointmentDto, user: AuthUser): Promise<AppointmentDetailsDto> {
    this.logger.warn(`Using stubbed implementation for updateAppointment - Appointment model not found in schema (ID: ${id})`);
    throw new BadRequestException('Cannot update appointment - Appointment model not found in schema');
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, user: AuthUser): Promise<AppointmentDetailsDto> {
    this.logger.warn(`Using stubbed implementation for cancelAppointment - Appointment model not found in schema (ID: ${id})`);
    throw new BadRequestException('Cannot cancel appointment - Appointment model not found in schema');
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(filters: FilterAppointmentsDto, user: AuthUser): Promise<AppointmentStatsDto> {
    this.logger.warn('Using stubbed implementation for getAppointmentStats - Appointment model not found in schema');

    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      revenue: 0,
      averageRating: 0,
      statusDistribution: {},
      monthlyStats: [],
    };
  }

  /**
   * Get appointments for a specific tenant
   */
  async getTenantAppointments(tenantId: string, filters: FilterAppointmentsDto): Promise<AppointmentDetailsDto[]> {
    this.logger.warn(
      `Using stubbed implementation for getTenantAppointments - Appointment model not found in schema (Tenant ID: ${tenantId})`,
    );
    return [];
  }

  /**
   * Check if a user is eligible for a review
   */
  async checkReviewEligibility(userId: string, type: 'service' | 'staff', id: string): Promise<{ eligible: boolean; message?: string }> {
    this.logger.warn(`Using stubbed implementation for checkReviewEligibility - Appointment model not found in schema`);
    return { eligible: false, message: 'Appointment model not found in schema' };
  }

  /**
   * Helper method to map appointment to response DTO
   */
  private mapToAppointmentResponse(appointment: StubAppointment): AppointmentResponseDto {
    if (!appointment) {
      throw new BadRequestException('Appointment is required');
    }

    const status = toAppointmentStatus(appointment.status);
    const title = (appointment.notes && appointment.notes.split('\n')[0]) || 'Appointment';

    return {
      id: appointment.id,
      title,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      status,
      customerId: appointment.customerId,
      staffId: appointment.staffId || null,
      salonId: appointment.salonId,
      totalPrice: this.toNumber(appointment.totalPrice),
      totalDuration: appointment.totalDuration,
      isPaid: appointment.isPaid,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  /**
   * Format a date to ISO string
   */
  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    return date.toISOString();
  }
}
