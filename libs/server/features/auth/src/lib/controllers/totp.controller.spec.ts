import { TotpController } from './totp.controller';
import { UnauthorizedException } from '@nestjs/common';
import type { TotpPort } from '@cthub-bsaas/server-contracts-auth';
import type { VerifyTotpDto } from '../dto/verify-totp.dto';

describe('TotpController', () => {
  it('setup returns qrCodeDataUrl from service', async () => {
    const service: jest.Mocked<TotpPort> = {
      generateSecret: jest.fn().mockResolvedValue({ qrCodeDataUrl: 'data:image/png;base64,AAA', secret: 's' }),
      verifyToken: jest.fn(),
    };
    const ctrl = new TotpController(service);
    const req: { user: { id: string } } = { user: { id: 'u1' } };
    const res = await ctrl.setup(req);
    expect(res.qrCodeDataUrl).toContain('data:image/png');
    expect(service.generateSecret).toHaveBeenCalledWith('u1');
  });

  it('verify returns success on valid token', async () => {
    const service: jest.Mocked<TotpPort> = {
      generateSecret: jest.fn(),
      verifyToken: jest.fn().mockResolvedValue(true),
    };
    const ctrl = new TotpController(service);
    const req: { user: { id: string } } = { user: { id: 'u1' } };
    const dto: VerifyTotpDto = { token: '123456' } as VerifyTotpDto;
    const res = await ctrl.verify(req, dto);
    expect(res).toEqual({ success: true });
    expect(service.verifyToken).toHaveBeenCalledWith('u1', '123456');
  });

  it('verify throws on invalid token', async () => {
    const service: jest.Mocked<TotpPort> = {
      generateSecret: jest.fn(),
      verifyToken: jest.fn().mockResolvedValue(false),
    };
    const ctrl = new TotpController(service);
    const req: { user: { id: string } } = { user: { id: 'u1' } };
    const dto: VerifyTotpDto = { token: '000000' } as VerifyTotpDto;
    await expect(ctrl.verify(req, dto)).rejects.toThrow(UnauthorizedException);
  });

  it('enrollStart proxies to generateSecret and returns qr', async () => {
    const service: jest.Mocked<TotpPort> = {
      generateSecret: jest.fn().mockResolvedValue({ qrCodeDataUrl: 'data:image/png;base64,BBB', secret: 's' }),
      verifyToken: jest.fn(),
    };
    const ctrl = new TotpController(service);
    const req: { user: { id: string } } = { user: { id: 'u2' } };
    const res = await ctrl.enrollStart(req);
    expect(res.qrCodeDataUrl).toContain('data:image/png');
    expect(service.generateSecret).toHaveBeenCalledWith('u2');
  });

  it('enrollFinish returns success on valid token and throws on invalid', async () => {
    const service: jest.Mocked<TotpPort> = {
      generateSecret: jest.fn(),
      verifyToken: jest.fn().mockResolvedValue(true),
    };
    const ctrl = new TotpController(service);
    const req: { user: { id: string } } = { user: { id: 'u3' } };
    await expect(ctrl.enrollFinish(req, { token: '123456' } as VerifyTotpDto)).resolves.toEqual({ success: true });

    service.verifyToken.mockResolvedValue(false);
    await expect(ctrl.enrollFinish(req, { token: '000000' } as VerifyTotpDto)).rejects.toThrow(UnauthorizedException);
  });
});
