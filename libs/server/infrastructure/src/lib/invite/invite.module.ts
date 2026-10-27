import { Module } from '@nestjs/common';
import { PrismaModule } from '@cthub-bsaas/server-data-access';
import { INVITE_PORT } from '@cthub-bsaas/server-contracts-auth';
import { InvitePrismaAdapter } from './invite.adapter';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: INVITE_PORT,
      useClass: InvitePrismaAdapter,
    },
  ],
  exports: [INVITE_PORT],
})
export class InviteModule {}
