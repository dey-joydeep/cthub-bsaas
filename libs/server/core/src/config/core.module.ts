import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { I18nModule } from '../i18n/i18n.module';

@Global()
@Module({
  imports: [
    // ConfigModule is imported via the imports array in the module that imports CoreModule
    I18nModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [I18nModule],
})
export class CoreModule {}
