import { Module } from '@nestjs/common';
import { RECOVERY_CODES_PORT } from '@cthub-bsaas/server-contracts-auth';
import { RecoveryCodesMemoryAdapter } from './recovery.memory.adapter';

/**
 * @public
 * Infrastructure module registering a simple in-memory recovery codes adapter.
 */
@Module({
  providers: [
    { provide: RECOVERY_CODES_PORT, useClass: RecoveryCodesMemoryAdapter },
  ],
  exports: [RECOVERY_CODES_PORT],
})
export class RecoveryModule {}

