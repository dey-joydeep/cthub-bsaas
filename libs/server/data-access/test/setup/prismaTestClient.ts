import { PrismaClient, Prisma } from '@prisma/client';
import { execSync } from 'child_process';

class TestPrismaClient extends PrismaClient {
  private static instance: TestPrismaClient | null = null;
  private isTestEnvironment: boolean;

  private constructor() {
    super({
      log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });

    // Initialize isTestEnvironment after calling super()
    this.isTestEnvironment = process.env.NODE_ENV === 'test';

    // Properly typed event handler for beforeExit
    this.$on('beforeExit' as never, async () => {
      await this.$disconnect();
    });
  }

  public static getInstance(): TestPrismaClient {
    if (!TestPrismaClient.instance) {
      if (process.env.NODE_ENV === 'test') {
        // Reset the test database before the first test run
        execSync('npx prisma migrate reset --force --skip-seed', {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          },
        });
      }

      TestPrismaClient.instance = new TestPrismaClient();
    }
    return TestPrismaClient.instance;
  }

  public async clearDatabase() {
    if (!this.isTestEnvironment) {
      throw new Error('clearDatabase can only be used in test environment');
    }

    const tables = await this.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename FROM pg_tables 
            WHERE schemaname='public' AND tablename != '_prisma_migrations'
        `;

    try {
      await this.$executeRaw`TRUNCATE TABLE ${Prisma.raw(tables.map((t) => `"${t.tablename}"`).join(', '))} CASCADE;`;
    } catch (error) {
      console.error('Error clearing test database:', error);
      throw error;
    }
  }

  public async disconnect() {
    await this.$disconnect();
    TestPrismaClient.instance = null as unknown as TestPrismaClient;
  }
}

// Ensure we're using a test database URL in test environment
if (process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL) {
  const dbUrl = new URL(process.env.DATABASE_URL || '');
  dbUrl.pathname = `${dbUrl.pathname}_test`;
  process.env.TEST_DATABASE_URL = dbUrl.toString();
}

const prisma = TestPrismaClient.getInstance();

export default prisma;
