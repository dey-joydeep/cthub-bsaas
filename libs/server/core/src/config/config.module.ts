import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { configuration } from './configuration';
import { ConfigService } from './config.service';

const envValidationSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(1).optional(),
    JWT_ACCESS_SECRET: z.string().min(1).optional(),
    JWT_REFRESH_SECRET: z.string().min(1).optional(),
  })
  .refine((data) => data.JWT_SECRET || (data.JWT_ACCESS_SECRET && data.JWT_REFRESH_SECRET), {
    message: 'Either JWT_SECRET or both JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required',
  });

const encryptionKeySchema = z.string().regex(/^[0-9a-fA-F]{64}$/, 'encryption.key must be a 64-character hex string');

function validateConfig(env: Record<string, unknown>): Record<string, unknown> {
  const envResult = envValidationSchema.safeParse(env);
  if (!envResult.success) {
    const errorMessages = envResult.error.issues.map((e) => e.message).join(', ');
    throw new Error(`Configuration validation error: ${errorMessages}`);
  }

  const structured = configuration();
  const encResult = encryptionKeySchema.safeParse(structured.encryption?.key);
  if (!encResult.success) {
    throw new Error('Configuration validation error: encryption.key must be a 64-character hex string');
  }

  return env;
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env['NODE_ENV'] || 'development'}`],
      load: [configuration],
      validate: validateConfig,
    }),
  ],
  providers: [ConfigService],
  exports: [NestConfigModule, ConfigService],
})
export class ConfigModule {}
