import { Module } from '@nestjs/common';
import { WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import { WebAuthnSimpleAdapter } from './webauthn.simplewebauthn.adapter';
import { PrismaModule } from '@cthub-bsaas/server-data-access';
import { ConfigModule } from '@cthub-bsaas/server-core';
import { CHALLENGE_STORE } from './challenge.store';
import { RedisChallengeStore } from './challenge.store.redis';

/**
 * @public
 * Infrastructure module registering a production WebAuthn adapter using @simplewebauthn/server.
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    { provide: CHALLENGE_STORE, useClass: RedisChallengeStore },
    { provide: WEB_AUTHN_PORT, useClass: WebAuthnSimpleAdapter },
  ],
  exports: [WEB_AUTHN_PORT],
})
export class WebAuthnModule {}

