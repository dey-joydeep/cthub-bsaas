import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { BranchSettingsController } from './controllers/branch-settings.controller';
import { BusinessSettingsController } from './controllers/business-settings.controller';
import { SalonOwnerSettingsService } from './services/salon-owner-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessSettingsController, BranchSettingsController],
  providers: [SalonOwnerSettingsService],
  exports: [SalonOwnerSettingsService],
})
export class ServerFeatureSalonOwnerModule {}
