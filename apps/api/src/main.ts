import 'reflect-metadata';
import { JwtAuthGuard, RolesGuard } from '@cthub-bsaas/server-core/auth';
import { ConfigService } from './config/config.service';
import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { ConfigModule } from './config/config.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create the application with logging
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: true,
  });

  // Get config service
  const configService = app.select(ConfigModule).get(ConfigService);
  const { port, nodeEnv, isProduction } = configService.app;
  const { origins, methods, allowedHeaders, exposedHeaders, credentials, maxAge } =
    configService.cors;

  // Enable CORS with configuration
  app.enableCors({
    origin: (origin: string, callback: (error: Error | null, allow?: boolean) => void) => {
      try {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is allowed
        if (origins.includes('*') || origins.includes(origin)) {
          return callback(null, true);
        }
      } catch (e) {
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
    ],
    exposedHeaders: exposedHeaders || ['X-Request-Id'],
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

  // Request logging
  if (nodeEnv !== 'test' && nodeEnv !== 'production') {
    app.use(morgan('dev'));
  }

  // Cookie parser
  app.use(cookieParser());

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

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
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
