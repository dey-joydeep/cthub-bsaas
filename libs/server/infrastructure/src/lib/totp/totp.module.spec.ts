import { Test } from '@nestjs/testing';
import { TotpModule } from './totp.module';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from '@cthub-bsaas/server-core';

describe('TotpModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [TotpModule, ConfigModule.forRoot()],
    })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(EncryptionService)
    .useValue({
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    })
    .compile();

    expect(module).toBeDefined();
  });
});
