import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailPort } from '@cthub-bsaas/server-contracts-auth';
import type { Transporter } from 'nodemailer';
import { createRequire } from 'node:module';

export type NodemailerModule = typeof import('nodemailer');
export type NodemailerTransporter = Pick<Transporter, 'sendMail'>;
export type SendMailOptions = Parameters<NodemailerTransporter['sendMail']>[0];

@Injectable()
export class NodemailerEmailAdapter implements EmailPort, OnModuleInit {
  private transporter!: NodemailerTransporter;
  private readonly from: string;
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;

  constructor(private readonly config: ConfigService) {
    this.host = this.config.get<string>('EMAIL_HOST') ?? 'smtp.gmail.com';
    this.port = Number(this.config.get<string>('EMAIL_PORT') ?? '587');
    this.secure = (this.config.get<string>('EMAIL_SECURE') ?? 'false') === 'true' || this.port === 465;
    this.user = this.config.get<string>('EMAIL_USER') ?? '';
    this.from = this.config.get<string>('EMAIL_FROM') ?? this.user;
  }

  onModuleInit(): void {
    const nodemailer = this.loadNodemailer();
    const clientId = this.config.get<string>('EMAIL_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get<string>('EMAIL_OAUTH_CLIENT_SECRET');
    const refreshToken = this.config.get<string>('EMAIL_OAUTH_REFRESH_TOKEN');
    const accessToken = this.config.get<string>('EMAIL_OAUTH_ACCESS_TOKEN');

    if (clientId && clientSecret && refreshToken) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.user,
          clientId,
          clientSecret,
          refreshToken,
          accessToken,
        },
      });
    } else {
      const pass = this.config.get<string>('EMAIL_PASS') ?? '';
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: { user: this.user, pass },
      });
    }
  }

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    const isHtml = /<[^>]+>/.test(body);
    const payload: SendMailOptions = {
      from: this.from,
      to,
      subject,
      text: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
    };
    await this.transporter.sendMail(payload);
  }

  protected loadNodemailer(): NodemailerModule {
    const requireFn = createRequire(`${process.cwd()}/package.json`);
    return requireFn('nodemailer') as NodemailerModule;
  }
}
