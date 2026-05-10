import { Injectable } from '@nestjs/common';
import type { WebAuthnPort, CreationOptionsJSON, RequestOptionsJSON } from '@cthub-bsaas/server-contracts-auth';

/**
 * @public
 * Minimal, deterministic stub for WebAuthn flows to enable API wiring and tests.
 */
@Injectable()
export class WebAuthnStubAdapter implements WebAuthnPort {
  /** @inheritdoc */
  async startRegistration(userId: string, username: string): Promise<CreationOptionsJSON> {
    return { challenge: `reg-${userId}`, user: { name: username, id: userId } };
  }

  /** @inheritdoc */
  async finishRegistration(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return { credentialId: `cred-${userId}`, counter: 0 };
  }

  /** @inheritdoc */
  async startAuthentication(userId: string): Promise<RequestOptionsJSON> {
    return { challenge: `auth-${userId}` };
  }

  /** @inheritdoc */
  async finishAuthentication(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return { credentialId: `cred-${userId}`, counter: 1 };
  }
}

