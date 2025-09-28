import { Test } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { EMAIL_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConsoleEmailAdapter } from './email.console.adapter';
import { NodemailerEmailAdapter } from './email.nodemailer.adapter';
import { ConfigService } from '@nestjs/config';

describe('EmailModule', () => {
  let configService: ConfigService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    configService = new ConfigService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should provide ConsoleEmailAdapter in test environment', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('test');
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in development environment', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('development');
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in production environment', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('production');
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter when NODE_ENV is not set', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);
    delete process.env.NODE_ENV;
    const module = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();

    const emailPort = module.get(EMAIL_PORT);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });
});
