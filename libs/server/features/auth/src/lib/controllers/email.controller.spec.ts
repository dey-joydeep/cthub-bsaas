import { EmailController } from './email.controller';
import type { AuthService } from '../services/auth.service';
import { EmailChangeRequestDto } from '../dto/email-change-request.dto';
import { EmailChangeConfirmDto } from '../dto/email-change-confirm.dto';
import { BadRequestException } from '@nestjs/common';

describe('EmailController (unit)', () => {
  let controller: EmailController;
  let service: jest.Mocked<
    Pick<
      AuthService,
      'requestEmailChange' | 'confirmEmailChange' | 'requestEmailVerification' | 'verifyEmail' | 'verifyEmailOtp'
    >
  >;

  beforeEach(() => {
    service = {
      requestEmailChange: jest.fn(() => Promise.resolve(undefined)),
      confirmEmailChange: jest.fn(() => Promise.resolve(undefined)),
      requestEmailVerification: jest.fn(() => Promise.resolve(undefined)),
      verifyEmail: jest.fn(() => Promise.resolve(undefined)),
      verifyEmailOtp: jest.fn(() => Promise.resolve(undefined)),
    } as unknown as typeof service;
    controller = new EmailController(service as unknown as AuthService);
  });

  it('requestEmailChange delegates to service and returns success', async () => {
    const out = await controller.requestEmailChange(
      { newEmail: 'new@example.com' } as EmailChangeRequestDto,
      { user: { userId: 'u1' } },
    );
    expect(service.requestEmailChange).toHaveBeenCalledWith('u1', 'new@example.com');
    expect(out).toEqual({ success: true });
  });

  it('confirmEmailChange delegates to service and returns success', async () => {
    const out = await controller.confirmEmailChange({ token: 't' } as EmailChangeConfirmDto);
    expect(service.confirmEmailChange).toHaveBeenCalledWith('t');
    expect(out).toEqual({ success: true });
  });

  it('emailVerifyRequest delegates to service and returns success', async () => {
    const out = await controller.emailVerifyRequest({ email: 'e@example.com' });
    expect(service.requestEmailVerification).toHaveBeenCalledWith('e@example.com');
    expect(out).toEqual({ success: true });
  });

  it('emailVerifyConfirm uses token branch', async () => {
    const out = await controller.emailVerifyConfirm({ token: 'verify-token' });
    expect(service.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(out).toEqual({ success: true });
  });

  it('emailVerifyConfirm uses email+otp branch', async () => {
    const out = await controller.emailVerifyConfirm({ email: 'e@example.com', otp: '123456' });
    expect(service.verifyEmailOtp).toHaveBeenCalledWith('e@example.com', '123456');
    expect(out).toEqual({ success: true });
  });

  it('emailVerifyConfirm throws on invalid payload', () => {
    expect(() => controller.emailVerifyConfirm({} as { token?: string; email?: string; otp?: string })).toThrow(
      BadRequestException,
    );
  });
});
