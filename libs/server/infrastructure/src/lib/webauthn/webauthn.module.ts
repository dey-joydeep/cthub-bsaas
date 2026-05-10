import { Module } from '@nestjs/common';
import { WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import { WebAuthnSimpleAdapter } from './webauthn.simplewebauthn.adapter';
import { PrismaModule, PrismaService } from '@cthub-bsaas/server-data-access';
import { ConfigModule, ConfigService } from '@cthub-bsaas/server-core';
import { CHALLENGE_STORE, type ChallengeStore } from './challenge.store';
import { RedisChallengeStore } from './challenge.store.redis';
import { InMemoryChallengeStore } from './challenge.store.memory';

/**
 * @public
 * Infrastructure module registering a production WebAuthn adapter using @simplewebauthn/server.
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    // Challenge store selection: 'redis' (default) or 'memory'
    {
      provide: CHALLENGE_STORE,
      useFactory: (cfg: ConfigService) => {
        const mode = (process.env.WEB_AUTHN_CHALLENGE_STORE || 'redis').toLowerCase();
        if (mode === 'memory') {
          return new InMemoryChallengeStore();
        }
        return new RedisChallengeStore(cfg);
      },
      inject: [ConfigService],
    },
    // Adapter: always use production @simplewebauthn adapter; tests override via TestingModule when needed.
    {
      provide: WEB_AUTHN_PORT,
      useFactory: (cfg: ConfigService, prisma: PrismaService, store: ChallengeStore) =>
        new WebAuthnSimpleAdapter(cfg, prisma, store),
      inject: [ConfigService, PrismaService, CHALLENGE_STORE],
    },
  ],
  exports: [WEB_AUTHN_PORT],
})
export class WebAuthnModule {}
