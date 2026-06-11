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

const env = process.env;

export const configuration = registerAs('config', () => ({
  app: {
    port: parseInt(env['PORT'] || '3000', 10),
    nodeEnv: env['NODE_ENV'] || 'development',
    bodyLimitJson: env['API_BODY_LIMIT_JSON'] || '10mb',
    bodyLimitUrlEncoded: env['API_BODY_LIMIT_URLENCODED'] || '10mb',
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
    url: env['DATABASE_URL'] || '',
  },
  auth: {
    jwtAccessSecret: env['JWT_ACCESS_SECRET'] || env['JWT_SECRET'] || 'test-access-secret',
    jwtRefreshSecret: env['JWT_REFRESH_SECRET'] || env['JWT_SECRET'] || 'test-refresh-secret',
    jwtEmailChangeSecret: env['JWT_EMAIL_CHANGE_SECRET'] || env['JWT_SECRET'] || 'test-email-change-secret',
    jwtVerifyEmailSecret:
      env['JWT_VERIFY_EMAIL_SECRET'] || env['JWT_ACCESS_SECRET'] || env['JWT_SECRET'] || 'test-verify-email-secret',
    jwtExpiresIn: env['JWT_EXPIRES_IN'] || '1h',
    // Separate TTLs for refresh token cookie/JWT
    refreshTokenExpiresInDefault: env['REFRESH_TOKEN_EXPIRES_IN_DEFAULT'] || '7d',
    refreshTokenExpiresInCustomer: env['REFRESH_TOKEN_EXPIRES_IN_CUSTOMER'] || '180d',
    cookieDomain: env['AUTH_COOKIE_DOMAIN'],
  },
  cors: {
    origins: env['CORS_ORIGINS']?.split(',').map((origin) => origin.trim()) || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 600,
  },
  file: {
    uploadDir: env['UPLOAD_DIR'] || 'uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  rateLimit: {
    windowMs: parseInt(env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    max: parseInt(env['RATE_LIMIT_MAX'] || '100', 10),
  },
  email: {
    host: env['EMAIL_HOST'] || 'smtp.example.com',
    port: parseInt(env['EMAIL_PORT'] || '587', 10),
    secure: env['EMAIL_SECURE'] === 'true',
    user: env['EMAIL_USER'] || '',
    password: env['EMAIL_PASS'] || '',
    from: env['EMAIL_FROM'] || '',
  },
  encryption: {
    key:
      env['ENCRYPTION_KEY'] ||
      env['ENCRYPTION_TEST_KEY'] ||
      (env['NODE_ENV'] === 'test' ? '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' : ''),
  },
  log: {
    dir: env['LOG_DIR'] || 'logs',
    app: {
      file: env['LOG_APP_FILE'] || 'app.log',
      level: env['LOG_APP_LEVEL'] || env['LOG_LEVEL'] || 'info',
    },
    access: {
      file: env['LOG_ACCESS_FILE'] || 'access.log',
      level: env['LOG_ACCESS_LEVEL'] || env['LOG_LEVEL'] || 'info',
    },
  },
}));
