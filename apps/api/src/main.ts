import 'reflect-metadata';
import { ConfigService, CorrelationIdMiddleware, LoggerService } from '@cthub-bsaas/server-core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction, json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigModule } from '@cthub-bsaas/server-core';

/**
 * Sanitizes URLs for HTTP access logging by redacting sensitive path tokens and query secrets.
 *
 * @param {string} rawUrl - The incoming raw request URL.
 * @returns {string} The sanitized URL with sensitive tokens redacted.
 * @private
 */
function sanitizeUrlForLogging(rawUrl: string): string {
  return rawUrl
    .replace(/(\/auth\/(?:owner|staff)\/registration\/)[^/?#]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:token|secret|password|key)=)[^&#]+/gi, '$1[REDACTED]');
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Create the application with logging
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: true,
  });

  // Get config service
  const configService = app.select(ConfigModule).get(ConfigService);
  const { port, nodeEnv } = configService.app;
  const { origins, methods, allowedHeaders, exposedHeaders, credentials, maxAge } =
    configService.cors;

  // Enable CORS with configuration
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      try {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is allowed
        if (origins.includes('*') || origins.includes(origin)) {
          return callback(null, true);
        }
      } catch {
        // If URL parsing fails, deny the request
        return callback(new Error('Invalid origin'));
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: credentials,
    methods: methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: allowedHeaders || [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-XSRF-TOKEN',
      'X-Request-Id',
      'X-Correlation-Id',
      'Idempotency-Key',
      'X-Support-Reference',
      'X-Support-Reason',
    ],
    exposedHeaders: exposedHeaders || ['X-Request-Id', 'X-Correlation-Id'],
    maxAge: maxAge || 600, // 10 minutes
  });

  // Security middleware
  app.use(helmet.crossOriginResourcePolicy());
  app.use(helmet.crossOriginOpenerPolicy());
  app.use(helmet.crossOriginEmbedderPolicy());
  app.use(helmet.noSniff());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.xssFilter());
  app.use(helmet.frameguard({ action: 'deny' }));

  // Correlation ID middleware (adds/propagates x-correlation-id)
  const cidMw = new CorrelationIdMiddleware();
  app.use(cidMw.use.bind(cidMw));

  // Cookie parser
  app.use(cookieParser());

  // Request logging using centralized Pino LoggerService
  const loggerService = app.get(LoggerService);
  if (nodeEnv !== 'test') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const safeUrl = sanitizeUrlForLogging(req.originalUrl || req.url || '');
        loggerService.access(`${req.method} ${safeUrl} ${res.statusCode} ${duration}ms`, 'HTTP');
      });
      next();
    });
  }

  // Body parser
  const bodyLimitJson = configService.app.bodyLimitJson || '10mb';
  const bodyLimitUrlEncoded = configService.app.bodyLimitUrlEncoded || '10mb';
  app.use(json({ limit: bodyLimitJson }));
  app.use(urlencoded({ extended: true, limit: bodyLimitUrlEncoded }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 429 Retry-After is handled by the APP_FILTER ThrottlerRetryAfterFilter in AppModule

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '1'],
  });

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Beauty SaaS API')
      .setDescription('Beauty SaaS API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('token')
      .addServer(process.env['API_URL'] || 'http://localhost:3000')
      .addServer('http://localhost:3000')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Start the application
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);

  if (nodeEnv !== 'production') {
    logger.log(`API documentation available at: http://localhost:${port}/api`);
  }
}

// Start the application
if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    Logger.error('Failed to start application:', err);
    process.exit(1);
  });
}
