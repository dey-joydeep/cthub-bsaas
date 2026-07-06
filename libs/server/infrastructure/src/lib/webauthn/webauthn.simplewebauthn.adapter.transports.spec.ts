import { WebAuthnSimpleAdapter } from './webauthn.simplewebauthn.adapter';
import { ConfigService } from '@cthub-bsaas/server-core';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import type { ChallengeStore } from './challenge.store';
import * as sws from '@simplewebauthn/server';
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg' }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: Buffer.from('id'),
      credentialPublicKey: Buffer.from('pk'),
      counter: 0,
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth' }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 1 } }),
}));

describe('WebAuthnSimpleAdapter transports mapping', () => {
  const cfg = {
    get: (k: string) => ({ APP_NAME: 'x', WEB_AUTHN_CHALLENGE_TTL: '60' })[k],
    auth: { cookieDomain: 'localhost' },
    cors: { origins: ['http://localhost:4200'] },
  } as unknown as ConfigService;

  it('filters and maps transports for excludeCredentials and allowCredentials', async () => {
    const prisma = {
      credentialPasskey: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ credentialId: 'credA', transports: 'usb,ble,bogus' }])
          .mockResolvedValueOnce([{ credentialId: 'credB', transports: 'internal,unknown' }]),
      },
    } as unknown as PrismaService;
    const store: ChallengeStore = {
      set: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue('reg'),
    };

    await new WebAuthnSimpleAdapter(cfg, prisma as unknown as PrismaService, store).startRegistration('u1', 'name');
    expect(sws.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        // Cast matcher to unknown to avoid assigning `any` into a typed context
        excludeCredentials: expect.arrayContaining([expect.objectContaining({ transports: ['usb', 'ble'] })]) as unknown,
      }),
    );

    jest.spyOn(store, 'consume').mockResolvedValueOnce('auth');
    await new WebAuthnSimpleAdapter(cfg, prisma as unknown as PrismaService, store).startAuthentication('u1');
    expect(sws.generateAuthenticationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        // Cast matcher to unknown to avoid assigning `any` into a typed context
        allowCredentials: expect.arrayContaining([expect.objectContaining({ transports: ['internal'] })]) as unknown,
      }),
    );
  });
});
