import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SalonStaffRequestController } from './controllers/salon-staff-request.controller';
import { SalonStaffRequestService } from './services/salon-staff-request.service';

@Module({
  controllers: [SalonStaffRequestController],
  providers: [PrismaService, SalonStaffRequestService],
  exports: [SalonStaffRequestService],
})
export class SalonStaffRequestModule {}
