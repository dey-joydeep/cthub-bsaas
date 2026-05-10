import { Module } from '@nestjs/common';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './controllers/appointment.controller';
import { APPOINTMENT_REPOSITORY } from './repositories/appointment.repository';
import { PrismaAppointmentRepository } from './repositories/prisma-appointment.repository';

@Module({
  controllers: [AppointmentController],
  providers: [
    PrismaService,
    AppointmentService,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [AppointmentService],
})
export class AppointmentModule {}
