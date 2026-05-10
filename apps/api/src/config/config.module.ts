import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { configuration, validateConfig } from './configuration';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        API_BODY_LIMIT_JSON: Joi.string().default('10mb'),
        API_BODY_LIMIT_URLENCODED: Joi.string().default('10mb'),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
        CORS_ORIGINS: Joi.string().default(
          'http://localhost:4200,http://localhost:4201,http://localhost:4202',
        ),
        UPLOAD_DIR: Joi.string().default('uploads'),
        RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
        RATE_LIMIT_MAX: Joi.number().default(100),
        EMAIL_HOST: Joi.string().required(),
        EMAIL_PORT: Joi.number().default(587),
        EMAIL_SECURE: Joi.boolean().default(false),
        EMAIL_USER: Joi.string().required(),
        EMAIL_PASS: Joi.string().required(),
        EMAIL_FROM: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      validate: (config) => {
        // This will validate the configuration when the module is loaded
        return validateConfig(configuration() as any);
      },
    }),
  ],
  providers: [ConfigService],
  exports: [NestConfigModule, ConfigService],
})
export class ConfigModule {}
