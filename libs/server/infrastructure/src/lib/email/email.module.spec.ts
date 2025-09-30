import { Test } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { EMAIL_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConsoleEmailAdapter } from './email.console.adapter';
import { NodemailerEmailAdapter } from './email.nodemailer.adapter';
import { ConfigService } from '@nestjs/config';

describe('EmailModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should provide ConsoleEmailAdapter in test environment', async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'test' })
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in development environment', async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'development' })
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in production environment', async () => {
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'production' })
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter when NODE_ENV is not set', async () => {
    delete process.env.NODE_ENV;
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => undefined })
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });
});
