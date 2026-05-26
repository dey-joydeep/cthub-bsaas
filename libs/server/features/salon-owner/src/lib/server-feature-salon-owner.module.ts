import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { AppointmentSchedulingController } from './controllers/appointment-scheduling.controller';
import { BranchSettingsController } from './controllers/branch-settings.controller';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { CustomerCrmController } from './controllers/customer-crm.controller';
import { ServiceCatalogController } from './controllers/service-catalog.controller';
import { StaffController } from './controllers/staff.controller';
import { AppointmentSchedulingService } from './services/appointment-scheduling.service';
import { CustomerCrmService } from './services/customer-crm.service';
import { SalonOwnerSettingsService } from './services/salon-owner-settings.service';
import { StaffServiceCatalogService } from './services/staff-service-catalog.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BusinessSettingsController,
    BranchSettingsController,
    StaffController,
    ServiceCatalogController,
    CustomerCrmController,
    AppointmentSchedulingController,
  ],
  providers: [SalonOwnerSettingsService, StaffServiceCatalogService, CustomerCrmService, AppointmentSchedulingService],
  exports: [SalonOwnerSettingsService, StaffServiceCatalogService, CustomerCrmService, AppointmentSchedulingService],
})
export class ServerFeatureSalonOwnerModule {}
