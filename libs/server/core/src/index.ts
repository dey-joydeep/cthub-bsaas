// Core library public API

// Auth
export { ROLES_KEY, Roles } from './auth/decorators/roles.decorator';
export { IS_PUBLIC_KEY, Public } from './lib/auth/decorators/public.decorator';
export * from './lib/encryption/encryption.module';
export * from './lib/encryption/encryption.service';
export { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
export { RolesGuard } from './auth/guards/roles.guard';
export { StrongAuthGuard } from './auth/guards/strong-auth.guard';
export { CsrfGuard, SkipCsrf, SKIP_CSRF_KEY } from './auth/guards/csrf.guard';

// Config
export * from './config/core.module';

// Decorators
export * from './decorators/user.decorator';
export * from './decorators/current-user.decorator';

// Errors
export * from './errors/app.error';
export * from './errors/http-errors';

// Filters
export * from './filters/global-exception.filter';
export * from './filters/http-exception.filter';
export * from './filters/retry-after.filter';

// Models
export * from './models/notification.model';

// Testing - Not for production builds, but useful for integration tests
export * from './testing';

// Types
export * from './types/api.types';

// Validators
export * from './validators/appointment.validators';
export * from './validators/portfolio.validator';
export * from './validators/theme.validator';

// Ports

// HTTP
export * from './http/cookies/cookie-commands';
export * from './http/cookies/cookies.interceptor';
export * from './http/response-envelope.interceptor';
