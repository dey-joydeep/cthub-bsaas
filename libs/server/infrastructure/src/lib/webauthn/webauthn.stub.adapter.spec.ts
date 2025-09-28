import { Test } from '@nestjs/testing';
import { WebAuthnStubAdapter } from './webauthn.stub.adapter';

describe('WebAuthnStubAdapter', () => {
  let adapter: WebAuthnStubAdapter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [WebAuthnStubAdapter],
    }).compile();

    adapter = module.get<WebAuthnStubAdapter>(WebAuthnStubAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('startRegistration', () => {
    it('should return a challenge and user info', async () => {
      const userId = 'user-id';
      const username = 'test-user';
      const result = await adapter.startRegistration(userId, username);
      expect(result).toEqual({
        challenge: `reg-${userId}`,
        user: { name: username, id: userId },
      });
    });
  });

  describe('finishRegistration', () => {
    it('should return a credentialId and counter', async () => {
      const userId = 'user-id';
      const result = await adapter.finishRegistration(userId, {});
      expect(result).toEqual({
        credentialId: `cred-${userId}`,
        counter: 0,
      });
    });
  });

  describe('startAuthentication', () => {
    it('should return a challenge', async () => {
      const userId = 'user-id';
      const result = await adapter.startAuthentication(userId);
      expect(result).toEqual({
        challenge: `auth-${userId}`,
      });
    });
  });

  describe('finishAuthentication', () => {
    it('should return a credentialId and counter', async () => {
      const userId = 'user-id';
      const result = await adapter.finishAuthentication(userId, {});
      expect(result).toEqual({
        credentialId: `cred-${userId}`,
        counter: 1,
      });
    });
  });
});
