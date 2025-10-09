import { Injectable } from '@nestjs/common';
import type { WebAuthnPort, CreationOptionsJSON, RequestOptionsJSON } from '@cthub-bsaas/server-contracts-auth';

// TODO Review the stub implementation
/**
 * @public
 * Minimal, deterministic stub for WebAuthn flows to enable API wiring and tests.
 */
@Injectable()
export class WebAuthnStubAdapter implements WebAuthnPort {
  /** @inheritdoc */
  startRegistration(userId: string, username: string): Promise<CreationOptionsJSON> {
    return Promise.resolve({ challenge: `reg-${userId}`, user: { name: username, id: userId } });
  }

  /** @inheritdoc */
  finishRegistration(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return Promise.resolve({ credentialId: `cred-${userId}`, counter: 0 });
  }

  /** @inheritdoc */
  startAuthentication(userId: string): Promise<RequestOptionsJSON> {
    return Promise.resolve({ challenge: `auth-${userId}` });
  }

  /** @inheritdoc */
  finishAuthentication(userId: string, _response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }> {
    return Promise.resolve({ credentialId: `cred-${userId}`, counter: 1 });
  }
}
