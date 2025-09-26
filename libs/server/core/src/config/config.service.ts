import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from './configuration';

/* istanbul ignore next */
@Injectable()
export class ConfigService {
  private readonly configService: NestConfigService;

  /* istanbul ignore next */
  constructor(configService: NestConfigService) {
    this.configService = configService;
  }

  // -------- Section getters (preserve existing public API) --------
  get app(): Config['app'] {
    return this.configService.get<Config['app']>('config.app')!;
  }

  get database(): Config['database'] {
    return this.configService.get<Config['database']>('config.database')!;
  }

  get auth(): Config['auth'] {
    return this.configService.get<Config['auth']>('config.auth')!;
  }

  get cors(): Config['cors'] {
    return this.configService.get<Config['cors']>('config.cors')!;
  }

  get file(): Config['file'] {
    return this.configService.get<Config['file']>('config.file')!;
  }

  get rateLimit(): Config['rateLimit'] {
    return this.configService.get<Config['rateLimit']>('config.rateLimit')!;
  }

  get email(): Config['email'] {
    return this.configService.get<Config['email']>('config.email')!;
  }

  get encryption(): Config['encryption'] {
    return this.configService.get<Config['encryption']>('config.encryption')!;
  }

  get log(): Config['log'] {
    return this.configService.get<Config['log']>('config.log')!;
  }

  // -------- Generic getters (typed; keep spec expectations) --------
  /**
   * Get a configuration value by key.
   * Accepts either "app.port" or "config.app.port".
   */
  get<T = unknown>(key: string): T | undefined {
    const k = key.startsWith('config.') ? key : `config.${key}`;
    return this.configService.get<T>(k);
  }

  /**
   * Get a required configuration value by key.
   * Throws if the key is not present.
   */
  getRequired<T = unknown>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' is required but was not found`);
    }
    return value;
  }
}
