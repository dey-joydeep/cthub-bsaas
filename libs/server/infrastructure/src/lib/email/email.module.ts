import { Module } from '@nestjs/common';
import { EMAIL_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConsoleEmailAdapter } from './email.console.adapter';
import { NodemailerEmailAdapter } from './email.nodemailer.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * @public
 * Infrastructure module that registers the console-based {@link ConsoleEmailAdapter}
 * as the implementation for {@link EMAIL_PORT}.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = (config.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development').toLowerCase();
        if (env === 'test') return new ConsoleEmailAdapter();
        return new NodemailerEmailAdapter(config);
      },
    },
  ],
  exports: [EMAIL_PORT],
})
export class EmailModule {}
