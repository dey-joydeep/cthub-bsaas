import { Test } from '@nestjs/testing';
import { WebAuthnModule } from './webauthn.module';
import { CHALLENGE_STORE, type ChallengeStore } from './challenge.store';
import { InMemoryChallengeStore } from './challenge.store.memory';
import { RedisChallengeStore } from './challenge.store.redis';

describe('WebAuthnModule provider selection (challenge store)', () => {
  const original = process.env.WEB_AUTHN_CHALLENGE_STORE;

  afterEach(() => {
    if (original == null) delete process.env.WEB_AUTHN_CHALLENGE_STORE;
    else process.env.WEB_AUTHN_CHALLENGE_STORE = original;
  });

  it('selects InMemoryChallengeStore when WEB_AUTHN_CHALLENGE_STORE=memory', async () => {
    process.env.WEB_AUTHN_CHALLENGE_STORE = 'memory';
    const moduleRef = await Test.createTestingModule({ imports: [WebAuthnModule] }).compile();
    const store = moduleRef.get<ChallengeStore>(CHALLENGE_STORE);
    expect(store).toBeInstanceOf(InMemoryChallengeStore);
  });

  it('defaults to RedisChallengeStore when env unset/other', async () => {
    delete process.env.WEB_AUTHN_CHALLENGE_STORE;
    const moduleRef = await Test.createTestingModule({ imports: [WebAuthnModule] }).compile();
    const store = moduleRef.get<ChallengeStore>(CHALLENGE_STORE);
    expect(store).toBeInstanceOf(RedisChallengeStore);
  });
});
