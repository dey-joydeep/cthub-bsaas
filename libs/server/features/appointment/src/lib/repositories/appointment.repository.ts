import { CreateAppointmentDto } from '../dto/requests/create-appointment.dto';
import { AuthUser } from '@cthub-bsaas/core';
import { AppointmentWithRelations } from '../types/appointment.types';

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';

export interface AppointmentRepository {
  findById(id: string, includeRelations?: boolean): Promise<AppointmentWithRelations | null>;

  create(createAppointmentDto: CreateAppointmentDto, user: AuthUser): Promise<AppointmentWithRelations>;
}

// This will be used for dependency injection
export interface IAppointmentRepository extends AppointmentRepository {}
