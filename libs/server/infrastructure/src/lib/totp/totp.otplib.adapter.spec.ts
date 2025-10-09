import { Test } from '@nestjs/testing';
import { TotpOtplibAdapter } from './totp.otplib.adapter';
import {
  USER_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  type IUserRepository,
  type ICredentialTotpRepository,
} from '@cthub-bsaas/server-contracts-auth';
import { EncryptionService } from '@cthub-bsaas/server-core';
import { NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { Prisma, type CredentialTOTP, type User } from '@prisma/client';
import { Buffer } from 'node:buffer';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';

type EncryptionStub = DeepMockProxy<EncryptionService>;
type UserWithRoles = User & { roles: { role: { name: string } }[] };

type MockedUserRepo = DeepMockProxy<IUserRepository>;
type MockedTotpRepo = DeepMockProxy<ICredentialTotpRepository>;

type ModuleRefs = {
  adapter: TotpOtplibAdapter;
  userRepository: MockedUserRepo;
  credentialTotpRepository: MockedTotpRepo;
  encryptionService: EncryptionStub;
};

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('secret'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/CthubBsaas:test@example.com?secret=secret&issuer=CthubBsaas'),
    verify: jest.fn(),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,encoded'),
}));

const authenticatorMock = authenticator as jest.Mocked<typeof authenticator>;
const toDataURLMock = qrcode.toDataURL as jest.MockedFunction<typeof qrcode.toDataURL>;

describe('TotpOtplibAdapter', () => {
  const now = new Date('2023-01-01T00:00:00.000Z');

  const baseUser = Prisma.validator<User>()({
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hash',
    phone: null,
    isVerified: false,
    registrationStatus: 'PENDING',
    isMFAEnrollRequired: false,
    mfaReminderFirstAt: null,
    mfaReminderLastAt: null,
    isActive: true,
    name: null,
    avatarUrl: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    salonTenantId: null,
    emailVerifiedAt: null,
  });

  const createUserRecord = (overrides: Partial<UserWithRoles> = {}): UserWithRoles => ({
    ...baseUser,
    roles: [],
    ...overrides,
  });

  const baseCredential = Prisma.validator<CredentialTOTP>()({
    id: 'cred-id',
    userId: 'user-id',
    secretEncrypted: Buffer.from('encrypted-secret'),
    secretVersion: 1,
    verified: false,
    createdAt: now,
    lastUsedAt: null,
  });

  const createCredentialRecord = (overrides: Partial<CredentialTOTP> = {}): CredentialTOTP => ({
    ...baseCredential,
    ...overrides,
  });

  const setupModule = async (): Promise<ModuleRefs> => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TotpOtplibAdapter,
        { provide: USER_REPOSITORY, useValue: mockDeep<IUserRepository>() },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: mockDeep<ICredentialTotpRepository>() },
        { provide: EncryptionService, useValue: mockDeep<EncryptionService>() },
      ],
    }).compile();

    const adapter = moduleRef.get(TotpOtplibAdapter);
    const userRepository = moduleRef.get<MockedUserRepo>(USER_REPOSITORY);
    const credentialTotpRepository = moduleRef.get<MockedTotpRepo>(CREDENTIAL_TOTP_REPOSITORY);
    const encryptionService = moduleRef.get<EncryptionStub>(EncryptionService);
    encryptionService.encrypt.mockReturnValue('encrypted-secret');
    encryptionService.decrypt.mockReturnValue('decrypted-secret');

    return {
      adapter,
      userRepository,
      credentialTotpRepository,
      encryptionService,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authenticatorMock.verify.mockReset();
    toDataURLMock.mockClear();
  });

  it('should be defined', async () => {
    const { adapter } = await setupModule();
    expect(adapter).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret and QR code', async () => {
      const { adapter, userRepository, credentialTotpRepository } = await setupModule();
      const user = createUserRecord();
      userRepository.findById.mockResolvedValue(user);
      credentialTotpRepository.findByUserId.mockResolvedValue(null);

      const result = await adapter.generateSecret(user.id);

      expect(result).toEqual({ qrCodeDataUrl: 'data:image/png;base64,encoded', secret: 'secret' });
      expect(toDataURLMock).toHaveBeenCalled();
      expect(credentialTotpRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        secretEncrypted: Buffer.from('encrypted-secret'),
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      const { adapter, userRepository } = await setupModule();
      userRepository.findById.mockResolvedValue(null);

      await expect(adapter.generateSecret('invalid-user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyToken', () => {
    it('should return true for a valid token', async () => {
      const { adapter, credentialTotpRepository } = await setupModule();
      const credential = createCredentialRecord({ verified: false });
      credentialTotpRepository.findByUserId.mockResolvedValue(credential);
      authenticatorMock.verify.mockReturnValue(true);

      const result = await adapter.verifyToken('user-id', '123456');

      expect(result).toBe(true);
      expect(credentialTotpRepository.update).toHaveBeenCalledWith('user-id', { verified: true });
    });

    it('should return false for an invalid token', async () => {
      const { adapter, credentialTotpRepository } = await setupModule();
      const credential = createCredentialRecord({ verified: false });
      credentialTotpRepository.findByUserId.mockResolvedValue(credential);
      authenticatorMock.verify.mockReturnValue(false);

      const result = await adapter.verifyToken('user-id', 'wrong-token');

      expect(result).toBe(false);
    });

    it('should return false if credential is not found', async () => {
      const { adapter, credentialTotpRepository } = await setupModule();
      credentialTotpRepository.findByUserId.mockResolvedValue(null);

      const result = await adapter.verifyToken('user-id', '123456');

      expect(result).toBe(false);
    });
  });
});
