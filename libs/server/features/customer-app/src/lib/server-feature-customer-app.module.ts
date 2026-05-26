import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

import { CustomerAppController } from './controllers/customer-app.controller';
import { CustomerAppService } from './services/customer-app.service';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerAppController],
  providers: [CustomerAppService],
  exports: [CustomerAppService],
})
export class ServerFeatureCustomerAppModule {}
