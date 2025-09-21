import { Test } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '../../config/config.service';

describe('EncryptionService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            encryption: {
              key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            },
          },
        },
      ],
    }).compile();
    const service = module.get<EncryptionService>(EncryptionService);
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt a string', async () => {
    const module = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            encryption: {
              key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            },
          },
        },
      ],
    }).compile();
    const service = module.get<EncryptionService>(EncryptionService);
    const originalText = 'This is a secret message';
    const encryptedText = service.encrypt(originalText);
    const decryptedText = service.decrypt(encryptedText);

    expect(encryptedText).not.toEqual(originalText);
    expect(decryptedText).toEqual(originalText);
  });

  it('should throw an error for a tampered message', async () => {
    const module = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            encryption: {
              key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            },
          },
        },
      ],
    }).compile();
    const service = module.get<EncryptionService>(EncryptionService);
    const originalText = 'This is a secret message';
    const encryptedText = service.encrypt(originalText);
    const tamperedText = encryptedText.slice(0, -2) + '00'; // Tamper with the auth tag

    expect(() => service.decrypt(tamperedText)).toThrow();
  });

  it('should throw an error if encryption key is not set', async () => {
    await expect(Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: { encryption: { key: '' } },
        },
      ],
    }).compile()).rejects.toThrow('ENCRYPTION_KEY is not set in environment variables');
  });

  it('should throw an error if encryption key is not the correct length', async () => {
    await expect(Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: { encryption: { key: 'short_key' } },
        },
      ],
    }).compile()).rejects.toThrow('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  });
});
