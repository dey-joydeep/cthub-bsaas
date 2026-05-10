import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { DATABASE_PORT } from '@cthub-bsaas/server-contracts-auth';

describe('DatabaseModule', () => {
  const prismaServiceStub: Partial<PrismaService> = {};

  const compileModule = (): Promise<TestingModule> =>
    Test.createTestingModule({
      imports: [DatabaseModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceStub)
      .compile();

  it('should compile the module', async () => {
    const moduleRef = await compileModule();
    expect(moduleRef).toBeDefined();
  });

  it('should provide the DATABASE_PORT', async () => {
    const moduleRef = await compileModule();
    const databasePort = moduleRef.get<PrismaService>(DATABASE_PORT);
    expect(databasePort).toBeDefined();
  });
});
