import { Test } from '@nestjs/testing';
import { TotpOtplibAdapter } from './totp.otplib.adapter';
import { USER_REPOSITORY, CREDENTIAL_TOTP_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { EncryptionService } from '@cthub-bsaas/server-core';
import { NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('secret'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/CthubBsaas:test@example.com?secret=secret&issuer=CthubBsaas'),
    verify: jest.fn(),
  },
}));

describe('TotpOtplibAdapter', () => {
  let adapter: TotpOtplibAdapter;
  let userRepository: any;
  let credentialTotpRepository: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TotpOtplibAdapter,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: CREDENTIAL_TOTP_REPOSITORY,
          useValue: {
            findByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn().mockReturnValue('encrypted-secret'),
            decrypt: jest.fn().mockReturnValue('decrypted-secret'),
          },
        },
      ],
    }).compile();

    adapter = module.get<TotpOtplibAdapter>(TotpOtplibAdapter);
    userRepository = module.get(USER_REPOSITORY);
    credentialTotpRepository = module.get(CREDENTIAL_TOTP_REPOSITORY);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret and QR code', async () => {
      const userId = 'user-id';
      const user = { id: userId, email: 'test@example.com' };
      userRepository.findById.mockResolvedValue(user);
      credentialTotpRepository.findByUserId.mockResolvedValue(null);

      const result = await adapter.generateSecret(userId);

      expect(result).toHaveProperty('qrCodeDataUrl');
      expect(result).toHaveProperty('secret');
      expect(credentialTotpRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = 'invalid-user-id';
      userRepository.findById.mockResolvedValue(null);

      await expect(adapter.generateSecret(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyToken', () => {
    it('should return true for a valid token', async () => {
      const userId = 'user-id';
      const token = '123456';
      const credential = { secretEncrypted: 'encrypted-secret', verified: false };
      credentialTotpRepository.findByUserId.mockResolvedValue(credential);
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = await adapter.verifyToken(userId, token);

      expect(result).toBe(true);
      expect(credentialTotpRepository.update).toHaveBeenCalledWith(userId, { verified: true });
    });

    it('should return false for an invalid token', async () => {
      const userId = 'user-id';
      const token = 'wrong-token';
      const credential = { secretEncrypted: 'encrypted-secret', verified: false };
      credentialTotpRepository.findByUserId.mockResolvedValue(credential);
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      const result = await adapter.verifyToken(userId, token);

      expect(result).toBe(false);
    });

    it('should return false if credential is not found', async () => {
      const userId = 'no-credential-user';
      const token = '123456';
      credentialTotpRepository.findByUserId.mockResolvedValue(null);

      const result = await adapter.verifyToken(userId, token);

      expect(result).toBe(false);
    });
  });
});
