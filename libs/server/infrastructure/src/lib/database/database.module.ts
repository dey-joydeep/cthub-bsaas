import { Global, Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '@cthub-bsaas/server-data-access';
import { DATABASE_PORT } from '@cthub-bsaas/server-contracts-auth';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: DATABASE_PORT,
      useExisting: PrismaService,
    },
  ],
  exports: [DATABASE_PORT, PrismaModule],
})
export class DatabaseModule {}
