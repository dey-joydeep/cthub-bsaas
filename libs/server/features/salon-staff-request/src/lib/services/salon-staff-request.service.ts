import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSalonStaffRequestDto } from '../dto/create-salon-staff-request.dto';
import { UpdateSalonStaffRequestDto } from '../dto/update-salon-staff-request.dto';
import { SalonStaffRequestQueryDto } from '../dto/salon-staff-request-query.dto';
import { SalonStaffRequestResponseDto } from '../dto/salon-staff-request-response.dto';
import { Prisma, SalonStaffRequestStatus } from '@prisma/client';

@Injectable()
export class SalonStaffRequestService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToResponseDto(prismaReq: any): SalonStaffRequestResponseDto {
    const dto = new SalonStaffRequestResponseDto();
    Object.assign(dto, {
      id: prismaReq.id,
      staffId: prismaReq.staffId,
      requestType: prismaReq.requestType,
      leaveFrom: prismaReq.leaveFrom || undefined,
      leaveTo: prismaReq.leaveTo || undefined,
      reason: prismaReq.reason || undefined,
      status: prismaReq.status,
      rejectionReason: prismaReq.rejectionReason || undefined,
      createdAt: prismaReq.createdAt,
      updatedAt: prismaReq.updatedAt,
    });
    return dto;
  }

  private buildWhereClause(query: SalonStaffRequestQueryDto): Prisma.SalonStaffRequestWhereInput {
    const where: Prisma.SalonStaffRequestWhereInput = {};

    if (query.staffId) {
      where.staffId = query.staffId;
    }
    if (query.requestType) {
      where.requestType = query.requestType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...(where.createdAt as object), lte: new Date(query.endDate) };
    }

    return where;
  }

  async getRequests(query: SalonStaffRequestQueryDto): Promise<SalonStaffRequestResponseDto[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const requests = await this.prisma.salonStaffRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return requests.map((req) => this.mapToResponseDto(req));
  }

  async getRequestById(id: string): Promise<SalonStaffRequestResponseDto> {
    const request = await this.prisma.salonStaffRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Salon staff request with ID ${id} not found`);
    }

    return this.mapToResponseDto(request);
  }

  async createRequest(createDto: CreateSalonStaffRequestDto): Promise<SalonStaffRequestResponseDto> {
    try {
      const created = await this.prisma.salonStaffRequest.create({
        data: {
          ...createDto,
          status: SalonStaffRequestStatus.pending,
          leaveFrom: createDto.leaveFrom || null,
          leaveTo: createDto.leaveTo || null,
          reason: createDto.reason || null,
        },
      });
      return this.mapToResponseDto(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A request with similar data already exists');
        }
      }
      throw new BadRequestException('Failed to create salon staff request');
    }
  }

  async updateRequest(id: string, updateDto: UpdateSalonStaffRequestDto): Promise<SalonStaffRequestResponseDto> {
    try {
      // Check if the request exists
      const existingRequest = await this.prisma.salonStaffRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        throw new NotFoundException(`Salon staff request with ID ${id} not found`);
      }

      // If status is being updated to rejected, ensure rejectionReason is provided
      if (updateDto.status === SalonStaffRequestStatus.rejected && !updateDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting a request');
      }

      const updateData: any = { ...updateDto, updatedAt: new Date() };

      // Only update rejectionReason if it's provided or if status is being changed to rejected
      if (updateDto.status === SalonStaffRequestStatus.rejected && !updateDto.rejectionReason) {
        updateData.rejectionReason = 'No reason provided';
      }

      const updated = await this.prisma.salonStaffRequest.update({
        where: { id },
        data: updateData,
      });

      return this.mapToResponseDto(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Salon staff request with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async deleteRequest(id: string): Promise<void> {
    try {
      await this.prisma.salonStaffRequest.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Salon staff request with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete salon staff request');
    }
  }
}
