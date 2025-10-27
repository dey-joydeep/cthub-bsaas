import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export interface AuthConfig {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtEmailChangeSecret: string;
  jwtVerifyEmailSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresInDefault?: string;
  refreshTokenExpiresInCustomer?: string;
  cookieDomain?: string;
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

export interface EncryptionConfig {
  key: string;
}

export interface LogTargetConfig {
  /** Absolute or relative filename for the log target. */
  file: string;
  /** Minimum log level threshold for the target. */
  level: string;
}

export interface LogConfig {
  /** Directory where log files are stored. */
  dir: string;
  /** Application log configuration. */
  app: LogTargetConfig;
  /** Access/security log configuration. */
  access: LogTargetConfig;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  file: FileConfig;
  rateLimit: RateLimitConfig;
  email: EmailConfig;
  encryption: EncryptionConfig;
  log: LogConfig;
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
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'test-access-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'test-refresh-secret',
    jwtEmailChangeSecret: process.env.JWT_EMAIL_CHANGE_SECRET || process.env.JWT_SECRET || 'test-email-change-secret',
    jwtVerifyEmailSecret:
      process.env.JWT_VERIFY_EMAIL_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'test-verify-email-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    // Separate TTLs for refresh token cookie/JWT
    refreshTokenExpiresInDefault: process.env.REFRESH_TOKEN_EXPIRES_IN_DEFAULT || '7d',
    refreshTokenExpiresInCustomer: process.env.REFRESH_TOKEN_EXPIRES_IN_CUSTOMER || '180d',
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN', 'X-Request-Id'],
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
  encryption: {
    key:
      process.env.ENCRYPTION_KEY ||
      process.env.ENCRYPTION_TEST_KEY ||
      (process.env.NODE_ENV === 'test' ? '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' : ''),
  },
  log: {
    dir: process.env.LOG_DIR || 'logs',
    app: {
      file: process.env.LOG_APP_FILE || 'app.log',
      level: process.env.LOG_APP_LEVEL || process.env.LOG_LEVEL || 'info',
    },
    access: {
      file: process.env.LOG_ACCESS_FILE || 'access.log',
      level: process.env.LOG_ACCESS_LEVEL || process.env.LOG_LEVEL || 'info',
    },
  },
}));
