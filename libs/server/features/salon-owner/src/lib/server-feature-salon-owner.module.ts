import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { AppointmentSchedulingController } from './controllers/appointment-scheduling.controller';
import { BranchSettingsController } from './controllers/branch-settings.controller';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { CustomerCrmController } from './controllers/customer-crm.controller';
import { InventoryController } from './controllers/inventory.controller';
import { PosController } from './controllers/pos.controller';
import { ServiceCatalogController } from './controllers/service-catalog.controller';
import { StaffController } from './controllers/staff.controller';
import { AppointmentSchedulingService } from './services/appointment-scheduling.service';
import { CustomerCrmService } from './services/customer-crm.service';
import { PosInventoryService } from './services/pos-inventory.service';
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
    PosController,
    InventoryController,
  ],
  providers: [SalonOwnerSettingsService, StaffServiceCatalogService, CustomerCrmService, AppointmentSchedulingService, PosInventoryService],
  exports: [SalonOwnerSettingsService, StaffServiceCatalogService, CustomerCrmService, AppointmentSchedulingService, PosInventoryService],
})
export class ServerFeatureSalonOwnerModule {}
