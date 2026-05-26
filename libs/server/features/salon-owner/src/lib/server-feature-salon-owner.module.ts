import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { BranchSettingsController } from './controllers/branch-settings.controller';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardQueryService } from './services/dashboard-query.service';
import { SalonOwnerSettingsService } from './services/salon-owner-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessSettingsController, BranchSettingsController, DashboardController],
  providers: [SalonOwnerSettingsService, DashboardQueryService],
  exports: [SalonOwnerSettingsService, DashboardQueryService],
})
export class ServerFeatureSalonOwnerModule {}
