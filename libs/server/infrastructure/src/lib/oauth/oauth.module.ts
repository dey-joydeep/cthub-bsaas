import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@cthub-bsaas/server-core';
import { OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { OAuthAdapter } from './oauth.adapter';
import { GoogleOAuthAdapter } from './google.oauth.adapter';
import { MetaOAuthAdapter } from './meta.oauth.adapter';
import { OAUTH_STATE_STORE, type OAuthStateStore } from './state.store';
import { RedisOAuthStateStore } from './state.store.redis';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: OAUTH_STATE_STORE, useClass: RedisOAuthStateStore },
    // Select adapter by env, default to dev adapter to avoid network calls in tests
    {
      provide: OAUTH_PORT,
      useFactory: (cfg: ConfigService, store: OAuthStateStore) => {
        const mode = (process.env.OAUTH_ADAPTER || 'dev').toLowerCase();
        switch (mode) {
          case 'google':
            return new GoogleOAuthAdapter(cfg, store);
          case 'meta':
          case 'facebook':
            return new MetaOAuthAdapter(cfg, store);
          default:
            return new OAuthAdapter(cfg);
        }
      },
      inject: [ConfigService, OAUTH_STATE_STORE],
    },
  ],
  exports: [OAUTH_PORT],
})
export class OAuthModule {}

