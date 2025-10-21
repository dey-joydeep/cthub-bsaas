import { Injectable } from '@nestjs/common';
import type { WebAuthnPort, CreationOptionsJSON, RequestOptionsJSON } from '@cthub-bsaas/server-contracts-auth';

/**
 * Minimal, deterministic stub for WebAuthn flows to enable API wiring and tests.
 * Not for production use.
 */
@Injectable()
export class WebAuthnStubAdapter implements WebAuthnPort {
  startRegistration(userId: string, username: string): Promise<CreationOptionsJSON> {
    return Promise.resolve({ challenge: `reg-${userId}`, user: { name: username, id: userId } } as CreationOptionsJSON);
  }

  finishRegistration(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return Promise.resolve({ credentialId: `cred-${userId}`, counter: 0 });
  }

  startAuthentication(userId: string): Promise<RequestOptionsJSON> {
    return Promise.resolve({ challenge: `auth-${userId}` } as RequestOptionsJSON);
  }

  finishAuthentication(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return Promise.resolve({ credentialId: `cred-${userId}`, counter: 1 });
  }
}
