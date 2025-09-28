import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { DATABASE_PORT } from '@cthub-bsaas/server-contracts-auth';

describe('DatabaseModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

    expect(module).toBeDefined();
  });

  it('should provide the DATABASE_PORT', async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

    const databasePort = module.get(DATABASE_PORT);
    expect(databasePort).toBeDefined();
  });
});
