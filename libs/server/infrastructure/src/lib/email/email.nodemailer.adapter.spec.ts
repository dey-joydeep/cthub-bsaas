import type { ConfigService } from '@nestjs/config';
import {
  NodemailerEmailAdapter,
  type NodemailerModule,
  type NodemailerTransporter,
  type SendMailOptions,
} from './email.nodemailer.adapter';

jest.mock('node:module', () => ({
  createRequire: jest.fn(),
}));

const { createRequire } = jest.requireMock('node:module') as { createRequire: jest.Mock };
const createRequireMock = createRequire;

const createConfigService = (overrides: Record<string, string | undefined>): ConfigService => {
  const defaults: Record<string, string | undefined> = {
    EMAIL_HOST: 'smtp.gmail.com',
    EMAIL_PORT: '587',
    EMAIL_SECURE: 'false',
    EMAIL_USER: 'noreply@example.com',
    EMAIL_FROM: 'noreply@example.com',
    ...overrides,
  };

  return {
    get: <T = string>(key: string, defaultValue?: T) => (defaults[key] ?? defaultValue ?? undefined) as T,
  } as ConfigService;
};

type CreateTransportMock = jest.Mock<NodemailerTransporter, Parameters<NodemailerModule['createTransport']>>;
type SendMailMock = jest.Mock<Promise<unknown>, [SendMailOptions]>;

describe('NodemailerEmailAdapter', () => {
  const buildAdapter = (configOverrides: Record<string, string | undefined> = {}) => {
    createRequireMock.mockReset();
    const configService = createConfigService(configOverrides);
    const sendMailMock: SendMailMock = jest.fn((options) => Promise.resolve(options));
    const transporterStub: NodemailerTransporter = {
      sendMail: sendMailMock,
    };
    const createTransportMock: CreateTransportMock = jest.fn((..._args) => transporterStub);
    const nodemailerStub = {
      createTransport: createTransportMock,
      createTestAccount: jest.fn(),
      getTestMessageUrl: jest.fn(),
    } as unknown as NodemailerModule;

    class TestAdapter extends NodemailerEmailAdapter {
      constructor(
        config: ConfigService,
        private readonly moduleStub: NodemailerModule,
      ) {
        super(config);
      }

      protected loadNodemailer(): NodemailerModule {
        return this.moduleStub;
      }
    }

    const adapter = new TestAdapter(configService, nodemailerStub);
    return { adapter, createTransportMock, sendMailMock };
  };

  it('creates password transporter using host defaults', () => {
    const { adapter, createTransportMock } = buildAdapter({ EMAIL_PASS: 'smtp-pass' });

    adapter.onModuleInit();

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'noreply@example.com', pass: 'smtp-pass' },
    });
  });

  it('creates oauth transporter when oauth config present', () => {
    const { adapter, createTransportMock } = buildAdapter({
      EMAIL_USER: 'oauth@example.com',
      EMAIL_FROM: 'oauth-from@example.com',
      EMAIL_OAUTH_CLIENT_ID: 'client-id',
      EMAIL_OAUTH_CLIENT_SECRET: 'client-secret',
      EMAIL_OAUTH_REFRESH_TOKEN: 'refresh-token',
      EMAIL_OAUTH_ACCESS_TOKEN: 'access-token',
    });

    adapter.onModuleInit();

    expect(createTransportMock).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'oauth@example.com',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
        accessToken: 'access-token',
      },
    });
  });

  it('sends html and text bodies appropriately', async () => {
    const { adapter, sendMailMock } = buildAdapter({ EMAIL_FROM: 'custom@example.com' });
    adapter.onModuleInit();

    await adapter.sendMail('dest@example.com', 'Subject', '<p>Hi</p>');
    await adapter.sendMail('text@example.com', 'Subject', 'Plain body');

    expect(sendMailMock).toHaveBeenNthCalledWith(1, {
      from: 'custom@example.com',
      to: 'dest@example.com',
      subject: 'Subject',
      text: undefined,
      html: '<p>Hi</p>',
    });
    expect(sendMailMock).toHaveBeenNthCalledWith(2, {
      from: 'custom@example.com',
      to: 'text@example.com',
      subject: 'Subject',
      text: 'Plain body',
      html: undefined,
    });
  });

  it('loads nodemailer via createRequire when using default helper', () => {
    const requireFn = jest.fn(() => ({
      createTransport: jest.fn(() => ({ sendMail: jest.fn() })),
      createTestAccount: jest.fn(),
      getTestMessageUrl: jest.fn(),
    }));
    createRequireMock.mockReturnValue(requireFn);
    const adapter = new NodemailerEmailAdapter(createConfigService({ EMAIL_PASS: 'smtp-pass' }));

    adapter.onModuleInit();

    expect(createRequireMock).toHaveBeenCalledWith(`${process.cwd()}/package.json`);
    expect(requireFn).toHaveBeenCalledWith('nodemailer');
  });
});
