import { Test, type TestingModule } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { EMAIL_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConsoleEmailAdapter } from './email.console.adapter';
import { NodemailerEmailAdapter } from './email.nodemailer.adapter';
import { ConfigService } from '@nestjs/config';

type ConfigStub = Pick<ConfigService, 'get'>;

describe('EmailModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const compileModule = async (envValue: string | undefined): Promise<TestingModule> => {
    const configStub: ConfigStub = {
      get: jest.fn(() => envValue),
    };

    return Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configStub)
      .compile();
  };

  const getEmailPort = (moduleRef: TestingModule) =>
    moduleRef.get<ConsoleEmailAdapter | NodemailerEmailAdapter>(EMAIL_PORT);

  it('should provide ConsoleEmailAdapter in test environment', async () => {
    const moduleRef = await compileModule('test');
    const emailPort = getEmailPort(moduleRef);
    expect(emailPort).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in development environment', async () => {
    const moduleRef = await compileModule('development');
    const emailPort = getEmailPort(moduleRef);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter in production environment', async () => {
    const moduleRef = await compileModule('production');
    const emailPort = getEmailPort(moduleRef);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });

  it('should provide NodemailerEmailAdapter when NODE_ENV is not set', async () => {
    delete process.env.NODE_ENV;
    const moduleRef = await compileModule(undefined);
    const emailPort = getEmailPort(moduleRef);
    expect(emailPort).toBeInstanceOf(NodemailerEmailAdapter);
  });
});
