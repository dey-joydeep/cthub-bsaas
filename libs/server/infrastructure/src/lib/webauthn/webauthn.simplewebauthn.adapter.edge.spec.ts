import { WebAuthnSimpleAdapter } from './webauthn.simplewebauthn.adapter';
import { ConfigService } from '@cthub-bsaas/server-core';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import type { ChallengeStore } from './challenge.store';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg-chal' }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({ verified: true, registrationInfo: {
    credentialID: Buffer.from('cred-1'),
    credentialPublicKey: Buffer.from('pk'),
    counter: 0,
  }}),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth-chal' }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 2 } }),
}));

describe('WebAuthnSimpleAdapter edge cases', () => {
  const cfg = {
    get: (k: string) => ({
      AUTH_COOKIE_DOMAIN: 'localhost',
      CORS_ORIGINS: 'http://localhost:4200',
      APP_NAME: 'TestApp',
      WEB_AUTHN_CHALLENGE_TTL: '300',
    }[k]),
    auth: { jwtAccessSecret: 'secret', jwtExpiresIn: '1h', cookieDomain: 'localhost' },
    cors: { origins: ['http://localhost:4200'] },
  } as unknown as ConfigService;

  const prisma = {
    credentialPasskey: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue(undefined),
      findUnique: jest.fn().mockResolvedValue({ userId: 'u1', credentialId: 'Y3JlZC0x', publicKey: Buffer.from('pk'), counter: 0, transports: null }),
      update: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService;

  const store: ChallengeStore = {
    set: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(null),
  };

  it('throws when challenge is missing in finishRegistration', async () => {
    const wa = new WebAuthnSimpleAdapter(cfg, prisma, store);
    const resp = { id: 'cred-1' } as unknown as RegistrationResponseJSON;
    await expect(wa.finishRegistration('u1', resp as unknown as Record<string, unknown>)).rejects.toThrow('webauthn.challenge_missing');
  });

  it('throws when challenge is missing in finishAuthentication', async () => {
    const wa = new WebAuthnSimpleAdapter(cfg, prisma, store);
    const resp = { id: 'cred-1', rawId: 'raw', response: {}, type: 'public-key' } as unknown as AuthenticationResponseJSON;
    await expect(wa.finishAuthentication('u1', resp as unknown as Record<string, unknown>)).rejects.toThrow('webauthn.challenge_missing');
  });



  it('throws assertion_missing_id when id is absent', async () => {
    (store.consume as jest.Mock).mockResolvedValueOnce('auth-chal');
    const wa = new WebAuthnSimpleAdapter(cfg, prisma, store);
    const resp = { id: undefined as unknown as string, rawId: 'raw', response: {}, type: 'public-key' } as unknown as AuthenticationResponseJSON;
    await expect(wa.finishAuthentication('u1', resp as unknown as Record<string, unknown>)).rejects.toThrow('webauthn.assertion_missing_id');
  });

  it('throws credential_not_found when credential is missing', async () => {
    (store.consume as jest.Mock).mockResolvedValueOnce('auth-chal');
    const prismaMissing = {
      credentialPasskey: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaService;
    const wa = new WebAuthnSimpleAdapter(cfg, prismaMissing, store);
    const resp = { id: 'cred-1', rawId: 'raw', response: {}, type: 'public-key' } as unknown as AuthenticationResponseJSON;
    await expect(wa.finishAuthentication('u1', resp as unknown as Record<string, unknown>)).rejects.toThrow('webauthn.credential_not_found');
  });

  it('throws authentication_failed when verification fails', async () => {
    (store.consume as jest.Mock).mockResolvedValueOnce('auth-chal');
    const prismaOk = {
      credentialPasskey: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue({ userId: 'u1', credentialId: 'Y3JlZC0x', publicKey: Buffer.from('pk'), counter: 0, transports: null }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaService;
    const wa = new WebAuthnSimpleAdapter(cfg, prismaOk, store);
    const sws = await import('@simplewebauthn/server');
    type AuthVerifyRet = Awaited<ReturnType<typeof sws.verifyAuthenticationResponse>>;
    jest
      .spyOn(sws, 'verifyAuthenticationResponse')
      .mockResolvedValueOnce({ verified: false } as unknown as AuthVerifyRet);
    const resp = { id: 'cred-1', rawId: 'raw', response: {}, type: 'public-key' } as unknown as AuthenticationResponseJSON;
    await expect(wa.finishAuthentication('u1', resp as unknown as Record<string, unknown>)).rejects.toThrow('webauthn.authentication_failed');
  });
});
