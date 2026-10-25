import { Test } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PasskeysService } from '../../../src/lib/services/passkeys.service';
import { CREDENTIAL_PASSKEY_REPOSITORY, SOCIAL_ACCOUNT_REPOSITORY, USER_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from '../../../src/lib/services/audit.service';

describe('PasskeysService edge (Integration harnessed)', () => {
  it('throws 400 when credentialId is empty', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasskeysService,
        { provide: CREDENTIAL_PASSKEY_REPOSITORY, useValue: { countByUser: jest.fn(), deleteForUser: jest.fn(), listByUser: jest.fn() } },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: { findByUserId: jest.fn().mockResolvedValue([]) } },
        { provide: USER_REPOSITORY, useValue: { findById: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: 'hash' }) } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    const svc = moduleRef.get(PasskeysService);
    await expect(svc.delete('u1', '')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws 401 when deleteForUser returns false (not found)', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasskeysService,
        {
          provide: CREDENTIAL_PASSKEY_REPOSITORY,
          useValue: {
            countByUser: jest.fn().mockResolvedValue(2),
            deleteForUser: jest.fn().mockResolvedValue(false),
            listByUser: jest.fn(),
          },
        },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: { findByUserId: jest.fn().mockResolvedValue([{ id: 's1' }]) } },
        { provide: USER_REPOSITORY, useValue: { findById: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: 'hash' }) } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    const svc = moduleRef.get(PasskeysService);
    await expect(svc.delete('u1', 'missing-cred')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
