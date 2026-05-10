import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from './configuration';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

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

  /**
   * Get a configuration value by key
   * @param key The configuration key in dot notation (e.g., 'app.port')
   * @returns The configuration value or undefined if not found
   */
  get<T = any>(key: string): T | undefined {
    return this.configService.get<T>(`config.${key}`);
  }

  /**
   * Get a required configuration value by key
   * @param key The configuration key in dot notation
   * @returns The configuration value
   * @throws Error if the configuration value is not found
   */
  getRequired<T = any>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' is required but was not found`);
    }
    return value;
  }
}
