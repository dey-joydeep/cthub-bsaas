import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface DatabaseConfig {
  url: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  bodyLimitJson: string;
  bodyLimitUrlEncoded: string;
}

export interface CorsConfig {
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export interface FileConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  file: FileConfig;
  rateLimit: RateLimitConfig;
  email: EmailConfig;
}

export const configuration = registerAs('config', () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    bodyLimitJson: process.env.API_BODY_LIMIT_JSON || '10mb',
    bodyLimitUrlEncoded: process.env.API_BODY_LIMIT_URLENCODED || '10mb',
    get isProduction() {
      return this.nodeEnv === 'production';
    },
    get isDevelopment() {
      return this.nodeEnv === 'development';
    },
    get isTest() {
      return this.nodeEnv === 'test';
    },
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'changeme',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-XSRF-TOKEN',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 600,
  },
  file: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
}));

export const validationSchema = Joi.object<Config>({
  app: Joi.object({
    port: Joi.number().default(3000),
    nodeEnv: Joi.string().valid('development', 'production', 'test').default('development'),
    bodyLimitJson: Joi.string().default('10mb'),
    bodyLimitUrlEncoded: Joi.string().default('10mb'),
  }),
  database: Joi.object({
    url: Joi.string().required(),
  }),
  auth: Joi.object({
    jwtSecret: Joi.string().required(),
    jwtExpiresIn: Joi.string().default('1h'),
    refreshTokenExpiresIn: Joi.string().default('7d'),
  }),
  cors: Joi.object({
    origins: Joi.array().items(Joi.string().uri()).default([]),
    methods: Joi.array()
      .items(Joi.string())
      .default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
    allowedHeaders: Joi.array().items(Joi.string()).default(['Content-Type', 'Authorization']),
    exposedHeaders: Joi.array().items(Joi.string()).default([]),
    credentials: Joi.boolean().default(true),
    maxAge: Joi.number().default(600),
  }),
  file: Joi.object({
    uploadDir: Joi.string().default('uploads'),
    maxFileSize: Joi.number().default(10 * 1024 * 1024),
    allowedFileTypes: Joi.array()
      .items(Joi.string())
      .default(['image/jpeg', 'image/png', 'image/webp']),
  }),
  rateLimit: Joi.object({
    windowMs: Joi.number().default(900000),
    max: Joi.number().default(100),
  }),
  email: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().default(587),
    secure: Joi.boolean().default(false),
    user: Joi.string().required(),
    password: Joi.string().required(),
    from: Joi.string().required(),
  }),
});

export const validateConfig = (config: Config) => {
  const { error } = validationSchema.validate(config, { abortEarly: false });
  if (error) {
    throw new Error(`Configuration validation error: ${error.message}`);
  }
  return config;
};
