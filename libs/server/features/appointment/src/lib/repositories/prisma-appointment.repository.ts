import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { AppointmentRepository, APPOINTMENT_REPOSITORY } from './appointment.repository';
import { CreateAppointmentDto } from '../dto/requests/create-appointment.dto';
import { AuthUser } from '@cthub-bsaas/server-core';
import { AppointmentWithDetails } from '../models/appointment.model';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<AppointmentWithDetails | null> {
    // Stub implementation - returns null as Appointment model doesn't exist
    console.warn('Appointment model not found in schema - findById not implemented');
    return null;
  }

  async create(createAppointmentDto: CreateAppointmentDto, authUser: AuthUser): Promise<AppointmentWithDetails> {
    // Stub implementation - returns null as Appointment model doesn't exist
    console.warn('Appointment model not found in schema - create not implemented');
    return null;
  }
}

// This provider will be used for dependency injection
export const appointmentRepositoryProvider = {
  provide: APPOINTMENT_REPOSITORY,
  useClass: PrismaAppointmentRepository,
};
