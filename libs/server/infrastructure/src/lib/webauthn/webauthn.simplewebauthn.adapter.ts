import { Injectable, Inject } from '@nestjs/common';
import type { WebAuthnPort, CreationOptionsJSON, RequestOptionsJSON } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@cthub-bsaas/server-core';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { CHALLENGE_STORE, type ChallengeStore } from './challenge.store';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/types';

function toBufferFromBase64url(s: string): Uint8Array {
  return Buffer.from(s, 'base64url');
}
function toBase64urlFromBuffer(b: Uint8Array): string {
  return Buffer.from(b).toString('base64url');
}
function parseTransports(csv?: string | null): AuthenticatorTransportFuture[] | undefined {
  if (!csv) return undefined;
  const allowed = new Set<AuthenticatorTransportFuture>([
    'usb',
    'nfc',
    'ble',
    'hybrid',
    'internal',
    'smart-card',
  ] as const);
  const parts = csv.split(',').map((s) => s.trim());
  const filtered: AuthenticatorTransportFuture[] = [];
  for (const p of parts) {
    if (allowed.has(p as AuthenticatorTransportFuture)) filtered.push(p as AuthenticatorTransportFuture);
  }
  return filtered.length ? filtered : undefined;
}

/**
 * Production-grade WebAuthn adapter using @simplewebauthn/server.
 * Note: Challenges are kept in-memory in this initial version; for multi-instance deployments,
 * persist challenges in a shared store (DB/Redis) keyed by user+purpose with TTL.
 */
@Injectable()
export class WebAuthnSimpleAdapter implements WebAuthnPort {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CHALLENGE_STORE) private readonly store: ChallengeStore,
  ) {}

  private rpID(): string {
    const domain = this.config.auth.cookieDomain?.replace(/^\./, '');
    // Fallback to localhost if unset (dev)
    return domain && domain.length > 0 ? domain : 'localhost';
  }

  private rpName(): string {
    return this.config.get<string>('APP_NAME') ?? 'CTHub BSAAS';
  }

  private allowedOrigins(): string[] {
    // Use configured CORS origins as acceptable origins for WebAuthn
    const origins = this.config.cors.origins;
    if (origins && origins.length) return origins;
    const rp = this.rpID();
    return [`https://${rp}`, `http://${rp}:4200`, `http://${rp}:4201`, `http://${rp}:4202`];
  }

  async startRegistration(userId: string, username: string): Promise<CreationOptionsJSON> {
    const existing = await this.prisma.credentialPasskey.findMany({ where: { userId } });
    const options = await generateRegistrationOptions({
      rpID: this.rpID(),
      rpName: this.rpName(),
      userName: username,
      userID: userId,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        type: 'public-key',
        id: toBufferFromBase64url(c.credentialId),
        transports: parseTransports(c.transports),
      })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    });
    const ttl = parseInt(this.config.get<string>('WEB_AUTHN_CHALLENGE_TTL') ?? '300', 10);
    await this.store.set(`${userId}:reg`, options.challenge, ttl > 0 ? ttl : 300);
    return options as unknown as CreationOptionsJSON;
  }

  async finishRegistration(
    userId: string,
    response: Record<string, unknown>,
  ): Promise<{ credentialId: string; counter: number }> {
    const expectedChallenge = await this.store.consume(`${userId}:reg`);
    if (!expectedChallenge) throw new Error('webauthn.challenge_missing');
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: (response as unknown) as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: this.allowedOrigins(),
      expectedRPID: this.rpID(),
      requireUserVerification: false,
    });
    if (!verified || !registrationInfo) {
      throw new Error('webauthn.registration_failed');
    }

    const { credentialID, credentialPublicKey, counter } = registrationInfo;
    const credentialId = toBase64urlFromBuffer(credentialID);
    await this.prisma.credentialPasskey.upsert({
      where: { credentialId },
      update: {
        publicKey: credentialPublicKey,
        counter,
        transports: undefined,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        credentialId,
        publicKey: credentialPublicKey,
        counter,
        transports: undefined,
        lastUsedAt: new Date(),
      },
    });
    return { credentialId, counter };
  }

  async startAuthentication(userId: string): Promise<RequestOptionsJSON> {
    const credentials = await this.prisma.credentialPasskey.findMany({ where: { userId } });
    const options = await generateAuthenticationOptions({
      rpID: this.rpID(),
      allowCredentials: credentials.map((c) => ({
        type: 'public-key',
        id: toBufferFromBase64url(c.credentialId),
        transports: parseTransports(c.transports),
      })),
      userVerification: 'preferred',
    });
    const ttl = parseInt(this.config.get<string>('WEB_AUTHN_CHALLENGE_TTL') ?? '300', 10);
    await this.store.set(`${userId}:auth`, options.challenge, ttl > 0 ? ttl : 300);
    return options as unknown as RequestOptionsJSON;
  }

  async finishAuthentication(
    userId: string,
    response: Record<string, unknown>,
  ): Promise<{ credentialId: string; counter: number }> {
    const expectedChallenge = await this.store.consume(`${userId}:auth`);
    if (!expectedChallenge) throw new Error('webauthn.challenge_missing');

    const credId: string | undefined = ((response as unknown) as AuthenticationResponseJSON).id;
    if (!credId) throw new Error('webauthn.assertion_missing_id');

    const credential = await this.prisma.credentialPasskey.findUnique({ where: { credentialId: credId } });
    if (!credential || credential.userId !== userId) {
      throw new Error('webauthn.credential_not_found');
    }

    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response: (response as unknown) as AuthenticationResponseJSON,
      expectedChallenge,
      expectedOrigin: this.allowedOrigins(),
      expectedRPID: this.rpID(),
      authenticator: {
        credentialID: toBufferFromBase64url(credential.credentialId),
        credentialPublicKey: credential.publicKey,
        counter: credential.counter,
        transports: parseTransports(credential.transports),
      },
      requireUserVerification: false,
    });
    if (!verified || !authenticationInfo) {
      throw new Error('webauthn.authentication_failed');
    }

    await this.prisma.credentialPasskey.update({
      where: { credentialId: credential.credentialId },
      data: { counter: authenticationInfo.newCounter, lastUsedAt: new Date() },
    });

    return { credentialId: credential.credentialId, counter: authenticationInfo.newCounter };
  }
}
