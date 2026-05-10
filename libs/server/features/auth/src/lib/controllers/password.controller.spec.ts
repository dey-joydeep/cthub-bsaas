import { PasswordController } from './password.controller';
import type { AuthService } from '../services/auth.service';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import type { PasswordChangeDto } from '../dto/password-change.dto';

describe('PasswordController', () => {
  let service: jest.Mocked<Pick<
    AuthService,
    'requestPasswordReset' | 'resetPassword' | 'changePassword'
  >>;
  let controller: PasswordController;

  beforeEach(() => {
    service = {
      requestPasswordReset: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
    } as unknown as typeof service;
    controller = new PasswordController(service as unknown as AuthService);
  });

  it('forgotPassword calls service and returns success', async () => {
    const dto = { email: 'e@example.com' } as ForgotPasswordDto;
    const res = await controller.forgotPassword(dto);
    expect(service.requestPasswordReset).toHaveBeenCalledWith('e@example.com');
    expect(res).toEqual({ success: true });
  });

  it('resetPassword calls service and returns success', async () => {
    const dto = { token: 'tok', newPassword: 'Password#1' } as ResetPasswordDto;
    const res = await controller.resetPassword(dto);
    expect(service.resetPassword).toHaveBeenCalledWith('tok', 'Password#1');
    expect(res).toEqual({ success: true });
  });

  it('changePassword proxies user id and returns success', async () => {
    const dto = { currentPassword: 'Old#1', newPassword: 'New#1' } as PasswordChangeDto;
    const req = { user: { userId: 'u1' } } as { user: { userId: string } };
    const res = await controller.changePassword(dto, req);
    expect(service.changePassword).toHaveBeenCalledWith('u1', 'Old#1', 'New#1');
    expect(res).toEqual({ success: true });
  });

  describe('error propagation', () => {
    const forced = new Error('forced');

    it('forgotPassword propagates errors', async () => {
      (service.requestPasswordReset as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.forgotPassword({ email: 'e' } as ForgotPasswordDto)).rejects.toBe(forced);
    });

    it('resetPassword propagates errors', async () => {
      (service.resetPassword as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(
        controller.resetPassword({ token: 't', newPassword: 'p' } as ResetPasswordDto),
      ).rejects.toBe(forced);
    });

    it('changePassword propagates errors', async () => {
      (service.changePassword as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(
        controller.changePassword(
          { currentPassword: 'c', newPassword: 'n' } as PasswordChangeDto,
          { user: { userId: 'u1' } } as { user: { userId: string } },
        ),
      ).rejects.toBe(forced);
    });
  });
});

