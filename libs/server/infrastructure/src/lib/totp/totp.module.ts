import { EncryptionModule } from '@cthub-bsaas/server-core';
import { PrismaModule, UserRepository, CredentialTotpRepository } from '@cthub-bsaas/server-data-access';
import { TOTP_PORT, USER_REPOSITORY, CREDENTIAL_TOTP_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { Module } from '@nestjs/common';
import { TotpOtplibAdapter } from './totp.otplib.adapter';

/**
 * @public
 * Infrastructure module that registers the TOTP adapter implementation.
 */
@Module({
    imports: [PrismaModule, EncryptionModule],
    providers: [
        // Port implementation for TOTP
        {
            provide: TOTP_PORT,
            useClass: TotpOtplibAdapter,
        },
        // Dependencies required by the adapter
        {
            provide: USER_REPOSITORY,
            useClass: UserRepository,
        },
        {
            provide: CREDENTIAL_TOTP_REPOSITORY,
            useClass: CredentialTotpRepository,
        },
    ],
    exports: [TOTP_PORT],
})
export class TotpModule {}
