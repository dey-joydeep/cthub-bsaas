import { Test } from '@nestjs/testing';
import { InviteModule } from './invite.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';

describe('InviteModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [InviteModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});
