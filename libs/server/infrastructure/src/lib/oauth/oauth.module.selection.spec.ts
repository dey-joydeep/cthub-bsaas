import { Test } from '@nestjs/testing';
import { OAuthModule } from './oauth.module';
import { OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { OAuthAdapter } from './oauth.adapter';
import { GoogleOAuthAdapter } from './google.oauth.adapter';
import { MetaOAuthAdapter } from './meta.oauth.adapter';
import { OAUTH_STATE_STORE, type OAuthStateStore } from './state.store';

const dummyStateStore: OAuthStateStore = {
  set: jest.fn().mockResolvedValue(undefined),
  consume: jest.fn().mockResolvedValue(true),
};

describe('OAuthModule adapter selection', () => {
  const ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
  });
  afterEach(() => {
    process.env = ENV;
  });

  async function compile() {
    return Test.createTestingModule({ imports: [OAuthModule] })
      .overrideProvider(OAUTH_STATE_STORE)
      .useValue(dummyStateStore)
      .compile();
  }

  it('selects dev adapter by default', async () => {
    delete process.env.OAUTH_ADAPTER;
    const moduleRef = await compile();
    const adapter: unknown = moduleRef.get(OAUTH_PORT);
    expect(adapter).toBeInstanceOf(OAuthAdapter);
  });

  it('selects Google adapter when OAUTH_ADAPTER=google', async () => {
    process.env.OAUTH_ADAPTER = 'google';
    process.env.GOOGLE_CLIENT_ID = 'gid';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost/cb';
    const moduleRef = await compile();
    const adapter: unknown = moduleRef.get(OAUTH_PORT);
    expect(adapter).toBeInstanceOf(GoogleOAuthAdapter);
  });

  it('selects Meta adapter when OAUTH_ADAPTER=meta', async () => {
    process.env.OAUTH_ADAPTER = 'meta';
    process.env.META_CLIENT_ID = 'mid';
    process.env.META_REDIRECT_URI = 'http://localhost/cb';
    const moduleRef = await compile();
    const adapter: unknown = moduleRef.get(OAUTH_PORT);
    expect(adapter).toBeInstanceOf(MetaOAuthAdapter);
  });
});
