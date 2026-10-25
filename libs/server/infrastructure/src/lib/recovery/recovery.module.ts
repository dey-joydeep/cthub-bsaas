import { Module } from '@nestjs/common';
import { RECOVERY_CODES_PORT } from '@cthub-bsaas/server-contracts-auth';
import { RecoveryCodesPrismaAdapter } from './recovery.prisma.adapter';
import { PrismaModule } from '@cthub-bsaas/server-data-access';

/**
 * @public
 * Infrastructure module registering recovery codes adapter.
 * Uses Prisma-backed persistent storage in all environments.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: RECOVERY_CODES_PORT,
      useClass: RecoveryCodesPrismaAdapter,
    },
  ],
  exports: [RECOVERY_CODES_PORT],
})
export class RecoveryModule {}
