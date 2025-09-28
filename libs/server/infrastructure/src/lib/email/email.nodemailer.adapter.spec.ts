import { Test } from '@nestjs/testing';
import { NodemailerEmailAdapter } from './email.nodemailer.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

describe('NodemailerEmailAdapter', () => {
  let adapter: NodemailerEmailAdapter;
  let transporter: any;

  describe('with password', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot()],
        providers: [NodemailerEmailAdapter],
      }).compile();

      adapter = module.get<NodemailerEmailAdapter>(NodemailerEmailAdapter);
      await adapter.onModuleInit();
      transporter = (nodemailer.createTransport as jest.Mock).mock.results[0].value;
    });

    it('should be defined', () => {
      expect(adapter).toBeDefined();
    });

    it('should send email with correct arguments', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const body = 'Test Body';

      await adapter.sendMail(to, subject, body);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to,
        subject,
        text: body,
        html: undefined,
      });
    });
  });

  describe('with oauth2', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot()],
        providers: [
          NodemailerEmailAdapter,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'EMAIL_OAUTH_CLIENT_ID') return 'client-id';
                if (key === 'EMAIL_OAUTH_CLIENT_SECRET') return 'client-secret';
                if (key === 'EMAIL_OAUTH_REFRESH_TOKEN') return 'refresh-token';
                return null;
              }),
            },
          },
        ],
      }).compile();

      adapter = module.get<NodemailerEmailAdapter>(NodemailerEmailAdapter);
      await adapter.onModuleInit();
      transporter = (nodemailer.createTransport as jest.Mock).mock.results[0].value;
    });

    it('should be defined', () => {
      expect(adapter).toBeDefined();
    });

    it('should send email with correct arguments', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const body = 'Test Body';

      await adapter.sendMail(to, subject, body);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to,
        subject,
        text: body,
        html: undefined,
      });
    });
  });
});
