import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { OAuthAdapter } from './oauth.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: OAUTH_PORT, useClass: OAuthAdapter },
  ],
  exports: [OAUTH_PORT],
})
export class OAuthModule {}

