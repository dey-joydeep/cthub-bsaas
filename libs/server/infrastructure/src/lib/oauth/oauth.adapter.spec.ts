import { Test } from '@nestjs/testing';
import { OAuthAdapter } from './oauth.adapter';
import { ConfigModule } from '@cthub-bsaas/server-core';

describe('OAuthAdapter', () => {
  let adapter: OAuthAdapter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [OAuthAdapter],
    }).compile();

    adapter = module.get<OAuthAdapter>(OAuthAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('start', () => {
    it('should return a redirectUrl and state', async () => {
      const provider = 'google';
      const result = await adapter.start(provider);
      expect(result).toHaveProperty('redirectUrl');
      expect(result).toHaveProperty('state');
    });
  });

  describe('exchangeCode', () => {
    it('should return a provider and providerUserId', async () => {
      const provider = 'google';
      const code = 'test-code';
      const result = await adapter.exchangeCode(provider, code);
      expect(result).toHaveProperty('provider', provider);
      expect(result).toHaveProperty('providerUserId');
    });

    it('should return a provider and providerUserId when state is provided', async () => {
      const provider = 'google';
      const code = 'test-code';
      const state = 'test-state';
      const result = await adapter.exchangeCode(provider, code, state);
      expect(result).toHaveProperty('provider', provider);
      expect(result).toHaveProperty('providerUserId');
    });
  });
});
