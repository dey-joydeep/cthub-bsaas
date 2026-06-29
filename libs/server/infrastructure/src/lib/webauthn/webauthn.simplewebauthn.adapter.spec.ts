import { WebAuthnSimpleAdapter } from './webauthn.simplewebauthn.adapter';
import { ConfigService } from '@cthub-bsaas/server-core';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import type { ChallengeStore } from './challenge.store';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg-chal' }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: Buffer.from('cred-1'),
      credentialPublicKey: Buffer.from('pk'),
      counter: 0,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth-chal' }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 1 } }),
}));

describe('WebAuthnSimpleAdapter', () => {
  const cfg = {
    get: (k: string) =>
      ({
        AUTH_COOKIE_DOMAIN: 'localhost',
        CORS_ORIGINS: 'http://localhost:4200',
        APP_NAME: 'TestApp',
        WEB_AUTHN_CHALLENGE_TTL: '300',
      })[k],
    auth: { jwtAccessSecret: 'secret', jwtExpiresIn: '1h' },
    cors: { origins: ['http://localhost:4200'] },
  } as unknown as ConfigService;

  const prisma = {
    credentialPasskey: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue(undefined),
      findUnique: jest.fn().mockResolvedValue({ userId: 'u1', credentialId: 'Y3JlZC0x', publicKey: Buffer.from('pk'), counter: 0 }),
      update: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService;

  const store: ChallengeStore = {
    set: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue('reg-chal'),
  };

  it('start/finish registration and authentication', async () => {
    const wa = new WebAuthnSimpleAdapter(cfg, prisma, store);
    await wa.startRegistration('u1', 'user@example.com');
    expect(store.set).toHaveBeenCalledWith('u1:reg', 'reg-chal', expect.any(Number));

    const regResp: RegistrationResponseJSON = {
      id: 'cred-1',
      rawId: 'raw',
      response: {
        clientDataJSON: new ArrayBuffer(0),
        attestationObject: new ArrayBuffer(0),
        transports: undefined,
      },
      type: 'public-key',
      authenticatorAttachment: undefined,
      clientExtensionResults: {},
      authenticatorExtensionResults: {},
    } as unknown as RegistrationResponseJSON;
    const regRes = await wa.finishRegistration('u1', regResp as unknown as Record<string, unknown>);
    expect(regRes).toEqual({ credentialId: 'Y3JlZC0x', counter: 0 });

    (store.consume as jest.Mock).mockResolvedValueOnce('auth-chal');
    await wa.startAuthentication('u1');
    expect(store.set).toHaveBeenCalledWith('u1:auth', 'auth-chal', expect.any(Number));

    const authResp: AuthenticationResponseJSON = {
      id: 'cred-1',
      rawId: 'raw',
      response: {
        clientDataJSON: new ArrayBuffer(0),
        authenticatorData: new ArrayBuffer(0),
        signature: new ArrayBuffer(0),
        userHandle: null,
      },
      type: 'public-key',
      authenticatorAttachment: undefined,
      clientExtensionResults: {},
      authenticatorExtensionResults: {},
    } as unknown as AuthenticationResponseJSON;
    const authRes = await wa.finishAuthentication('u1', authResp as unknown as Record<string, unknown>);
    expect(authRes).toEqual({ credentialId: 'Y3JlZC0x', counter: 1 });
  });
});
