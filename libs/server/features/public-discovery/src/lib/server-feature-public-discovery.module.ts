import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { PublicDiscoveryController } from './controllers/public-discovery.controller';
import { PublicDiscoveryService } from './services/public-discovery.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicDiscoveryController],
  providers: [PublicDiscoveryService],
  exports: [PublicDiscoveryService],
})
export class ServerFeaturePublicDiscoveryModule {}
