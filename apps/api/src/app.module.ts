import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule, JwtAuthGuard, RolesGuard, CsrfGuard } from '@cthub-bsaas/server-core';
import { AuthModule } from '@cthub-bsaas/server-features-auth';
import { TotpModule } from '@cthub-bsaas/server-infrastructure';
import appConfig from './config/app.config';
import throttleConfig from './config/throttle.config';
import { ThrottlerRetryAfterFilter } from './http/filters/throttler-retry-after.filter';
import { ThrottlerRetryAfterGuard } from './http/guards/throttler-retry-after.guard';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, throttleConfig],
    }),

    // Core module (imports all core services)
    CoreModule,

    // Third-party modules
    ScheduleModule.forRoot(),

    // API rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60), // Default 60 seconds
            limit: config.get<number>('throttle.limit', 100), // Default 100 requests per ttl
          },
        ],
      }),
    }),
    // Feature modules
    AuthModule,
    TotpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerRetryAfterGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerRetryAfterFilter,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
