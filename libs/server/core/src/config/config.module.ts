import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { configuration, Config } from './configuration';
import { ConfigService } from './config.service';

// Schema for validating raw environment variables
const rawEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
}).unknown(true); // Allow other environment variables

// Schema for validating the structured, parsed config object
const structuredConfigSchema = Joi.object<Config, true>({
  app: Joi.object({
    port: Joi.number().required(),
    nodeEnv: Joi.string().required(),
    isProduction: Joi.boolean().required(),
    isDevelopment: Joi.boolean().required(),
    isTest: Joi.boolean().required(),
    bodyLimitJson: Joi.string().required(),
    bodyLimitUrlEncoded: Joi.string().required(),
  }).required(),
  database: Joi.object({
    url: Joi.string().required(),
  }).required(),
  auth: Joi.object({
    jwtAccessSecret: Joi.string().required(),
    jwtRefreshSecret: Joi.string().required(),
    jwtEmailChangeSecret: Joi.string().required(),
    jwtVerifyEmailSecret: Joi.string().required(),
    jwtExpiresIn: Joi.string().required(),
    refreshTokenExpiresInDefault: Joi.string().optional(),
      refreshTokenExpiresInCustomer: Joi.string().optional(),
      cookieDomain: Joi.string().optional().allow(''),
  }).required(),
  cors: Joi.object().required(),
  file: Joi.object().required(),
  rateLimit: Joi.object().required(),
  email: Joi.object().required(),
  encryption: Joi.object({
    key: Joi.string().hex().length(64).required(),
  }).required(),
  log: Joi.object({
    dir: Joi.string().required(),
    app: Joi.object({
      file: Joi.string().required(),
      level: Joi.string().required(),
    }).required(),
    access: Joi.object({
      file: Joi.string().required(),
      level: Joi.string().required(),
    }).required(),
  }).required(),
});

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
      load: [configuration],
      validationSchema: rawEnvSchema, // Use the simple schema for raw env vars
      validationOptions: {
        abortEarly: false,
      },
      // After loading and parsing, validate the final structured object
      validate: (config) => {
        const { error } = structuredConfigSchema.validate(config.config, {
          abortEarly: false,
        });
        if (error) {
          throw new Error(`Configuration validation error: ${error.message}`);
        }
        return config;
      },
    }),
  ],
  providers: [ConfigService],
  exports: [NestConfigModule, ConfigService],
})
export class ConfigModule {}
