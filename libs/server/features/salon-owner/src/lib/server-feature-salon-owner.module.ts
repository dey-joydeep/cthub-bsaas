import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { BranchSettingsController } from './controllers/branch-settings.controller';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { CustomerCrmController } from './controllers/customer-crm.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { ServiceCatalogController } from './controllers/service-catalog.controller';
import { StaffController } from './controllers/staff.controller';
import { CustomerCrmService } from './services/customer-crm.service';
import { SalonOwnerSettingsService } from './services/salon-owner-settings.service';
import { ServiceCatalogService } from './services/service-catalog.service';
import { StaffService } from './services/staff.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BusinessSettingsController,
    BranchSettingsController,
    StaffController,
    RolesController,
    PermissionsController,
    ServiceCatalogController,
    CustomerCrmController,
  ],
  providers: [SalonOwnerSettingsService, StaffService, ServiceCatalogService, CustomerCrmService],
  exports: [SalonOwnerSettingsService, StaffService, ServiceCatalogService, CustomerCrmService],
})
export class ServerFeatureSalonOwnerModule {}
