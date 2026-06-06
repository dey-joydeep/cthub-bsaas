import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@cthub-bsaas/server-core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CoreModule,
  JwtAuthGuard,
  RolesGuard,
  CsrfGuard,
  GlobalExceptionFilter,
} from '@cthub-bsaas/server-core';
import { AuthModule } from '@cthub-bsaas/server-feature-auth';
import { ServerFeatureCustomerAppModule } from '@cthub-bsaas/server-feature-customer-app';
import { ServerFeaturePublicDiscoveryModule } from '@cthub-bsaas/server-feature-public-discovery';
import { ServerFeatureSalonOwnerModule } from '@cthub-bsaas/server-feature-salon-owner';
import { TotpModule } from '@cthub-bsaas/server-infrastructure';

import { ThrottlerRetryAfterFilter } from './http/filters/throttler-retry-after.filter';
import { ThrottlerRetryAfterGuard } from './http/guards/throttler-retry-after.guard';

@Module({
  imports: [
    // Core configuration
    ConfigModule,

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
            ttl: config.rateLimit.windowMs,
            limit: config.rateLimit.max,
          },
        ],
      }),
    }),
    // Feature modules
    AuthModule,
    ServerFeatureSalonOwnerModule,
    ServerFeaturePublicDiscoveryModule,
    ServerFeatureCustomerAppModule,
    TotpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception normalization (adds canonical error envelope + correlationId)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
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
