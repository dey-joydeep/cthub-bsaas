import { Module } from '@nestjs/common';
import { WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import { WebAuthnStubAdapter } from './webauthn.stub.adapter';

/**
 * @public
 * Infrastructure module registering a simple (stub) WebAuthn adapter.
 * Replace with a real SimpleWebAuthn implementation when ready.
 */
@Module({
  providers: [
    { provide: WEB_AUTHN_PORT, useClass: WebAuthnStubAdapter },
  ],
  exports: [WEB_AUTHN_PORT],
})
export class WebAuthnModule {}

