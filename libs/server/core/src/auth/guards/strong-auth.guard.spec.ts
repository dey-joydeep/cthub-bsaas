import { Test } from '@nestjs/testing';
import { StrongAuthGuard } from './strong-auth.guard';
import { CREDENTIAL_TOTP_REPOSITORY, CREDENTIAL_PASSKEY_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import type { ExecutionContext } from '@nestjs/common';

describe('StrongAuthGuard', () => {
  const makeCtx = (user?: { userId: string; roles?: string[] }): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) as any }),
  } as unknown) as ExecutionContext;

  it('allows non-admin roles without strong auth', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        StrongAuthGuard,
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: { findByUserId: jest.fn(async () => null) } },
      ],
    }).compile();
    const guard = mod.get(StrongAuthGuard);
    await expect(guard.canActivate(makeCtx({ userId: 'u1', roles: ['OWNER'] }))).resolves.toBe(true);
  });

  it('allows admin with verified TOTP', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        StrongAuthGuard,
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: { findByUserId: jest.fn(async () => ({ verified: true })) } },
      ],
    }).compile();
    const guard = mod.get(StrongAuthGuard);
    await expect(guard.canActivate(makeCtx({ userId: 'u2', roles: ['ADMIN'] }))).resolves.toBe(true);
  });

  it('allows admin with passkey but no TOTP', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        StrongAuthGuard,
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: { findByUserId: jest.fn(async () => ({ verified: false })) } },
        { provide: CREDENTIAL_PASSKEY_REPOSITORY, useValue: { hasAny: jest.fn(async () => true) } },
      ],
    }).compile();
    const guard = mod.get(StrongAuthGuard);
    await expect(guard.canActivate(makeCtx({ userId: 'u3', roles: ['ADMIN'] }))).resolves.toBe(true);
  });
});
