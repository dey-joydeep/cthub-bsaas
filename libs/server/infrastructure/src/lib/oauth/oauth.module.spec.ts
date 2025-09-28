import { Test } from '@nestjs/testing';
import { OAuthModule } from './oauth.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';

describe('OAuthModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [OAuthModule],
    })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

    expect(module).toBeDefined();
  });
});
