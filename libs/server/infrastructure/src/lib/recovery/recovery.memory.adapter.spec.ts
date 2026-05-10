import { Test } from '@nestjs/testing';
import { RecoveryCodesMemoryAdapter } from './recovery.memory.adapter';

describe('RecoveryCodesMemoryAdapter', () => {
  let adapter: RecoveryCodesMemoryAdapter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RecoveryCodesMemoryAdapter],
    }).compile();

    adapter = module.get<RecoveryCodesMemoryAdapter>(RecoveryCodesMemoryAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('generate', () => {
    it('should generate the specified number of codes', async () => {
      const userId = 'user-id';
      const count = 5;
      const codes = await adapter.generate(userId, count);
      expect(codes).toHaveLength(count);
    });
  });

  describe('verifyAndConsume', () => {
    it('should return true for a valid code and consume it', async () => {
      const userId = 'user-id';
      const codes = await adapter.generate(userId);
      const code = codes[0];

      const result = await adapter.verifyAndConsume(userId, code);
      expect(result).toBe(true);

      const secondResult = await adapter.verifyAndConsume(userId, code);
      expect(secondResult).toBe(false);
    });

    it('should return false for an invalid code', async () => {
      const userId = 'user-id';
      await adapter.generate(userId);

      const result = await adapter.verifyAndConsume(userId, 'invalid-code');
      expect(result).toBe(false);
    });

    it('should return false for a user with no codes', async () => {
      const result = await adapter.verifyAndConsume('no-user', 'any-code');
      expect(result).toBe(false);
    });
  });
});
