import { Test } from '@nestjs/testing';
import { RecoveryModule } from './recovery.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';

describe('RecoveryModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [RecoveryModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});
