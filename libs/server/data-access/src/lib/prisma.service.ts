import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma, PrismaPromise } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

type UnwrapTuple<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};

type QueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
      errorFormat: 'pretty',
    });

    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';

    // Log query events in development
    if (this.isDevelopment) {
      this.$on('query', (e: QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma Error: ${e.message}\n${e.target}`, e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Error while disconnecting from the database', error);
      throw error;
    }
  }

  /**
   * Helper method to handle database operations with error handling
   */
  // Overload for array of Prisma promises
  async $transaction<P extends PrismaPromise<unknown>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<UnwrapTuple<P>>;

  // Overload for transaction callback
  async $transaction<P>(
    fn: (prisma: Omit<PrismaClient, '$transaction' | '$on' | '$connect' | '$disconnect' | '$use' | '$extends'>) => Promise<P>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<P>;

  // Implementation
  async $transaction(
    arg: unknown,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<unknown> {
    try {
      if (Array.isArray(arg)) {
        const { isolationLevel } = options || {};
        const txArg = arg as PrismaPromise<unknown>[];
        return await super.$transaction(txArg, { isolationLevel });
      } else if (typeof arg === 'function') {
        const cb = arg as (
          prisma: Omit<
            PrismaClient,
            '$transaction' | '$on' | '$connect' | '$disconnect' | '$use' | '$extends'
          >,
        ) => Promise<unknown>;
        return await super.$transaction(cb, options);
      }
      throw new Error('Invalid argument type for transaction');
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Handle Prisma specific errors
   */
  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known request errors
      this.logger.error(`Prisma Known Request Error (${error.code}): ${error.message}`, error.meta);

      // Add custom error handling for specific error codes
      switch (error.code) {
        case 'P2002':
          throw new Error('A unique constraint was violated');
        case 'P2025':
          throw new Error('Record not found');
        // Add more specific error codes as needed
      }
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      this.logger.error('Prisma Unknown Request Error:', error);
      throw new Error('An unknown database error occurred');
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      this.logger.fatal('Prisma Rust Panic:', error);
      throw new Error('A critical database error occurred');
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      this.logger.fatal('Prisma Initialization Error:', error);
      throw new Error('Failed to initialize the database connection');
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      this.logger.error('Prisma Validation Error:', error);
      throw new Error('Invalid database operation');
    }

    // Re-throw if it's not a Prisma error
    throw error;
  }
}
