import { Test } from '@nestjs/testing';
import { TotpController } from '../../../src/lib/controllers/totp.controller';
import { TOTP_PORT } from '@cthub-bsaas/server-contracts-auth';
import type { VerifyTotpDto } from '../../../src/lib/dto/verify-totp.dto';

describe('TotpController additional (integration-light)', () => {
  it('covers setup and verify branches', async () => {
    const totp = {
      generateSecret: jest.fn(async () => ({ qrCodeDataUrl: 'data:image/png;base64,AAA' })),
      verifyToken: jest.fn(async () => true),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [TotpController],
      providers: [{ provide: TOTP_PORT, useValue: totp }],
    }).compile();
    const ctrl = moduleRef.get(TotpController);
    type ReqCtx = { user: { id: string } };
    const setup = await ctrl.setup({ user: { id: 'u1' } } as ReqCtx);
    expect(setup.qrCodeDataUrl).toContain('data:image');
    const ok = await ctrl.verify({ user: { id: 'u1' } } as ReqCtx, { token: '123456' } as VerifyTotpDto);
    expect(ok).toEqual({ success: true });
    // failure branch
    (totp.verifyToken as jest.Mock).mockResolvedValueOnce(false);
    await expect(ctrl.verify({ user: { id: 'u1' } } as ReqCtx, { token: '000000' } as VerifyTotpDto)).rejects.toBeTruthy();
  });

  it('covers enroll/start and enroll/finish alias routes', async () => {
    const totp = {
      generateSecret: jest.fn(async () => ({ qrCodeDataUrl: 'data:image/png;base64,BBB' })),
      verifyToken: jest.fn(async () => true),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [TotpController],
      providers: [{ provide: TOTP_PORT, useValue: totp }],
    }).compile();
    const ctrl = moduleRef.get(TotpController);
    type ReqCtx = { user: { id: string } };
    const start = await ctrl.enrollStart({ user: { id: 'u2' } } as ReqCtx);
    expect(start.qrCodeDataUrl).toContain('data:image');
    const finish = await ctrl.enrollFinish({ user: { id: 'u2' } } as ReqCtx, { token: '123456' } as VerifyTotpDto);
    expect(finish).toEqual({ success: true });
    // failure branch for alias finish
    (totp.verifyToken as jest.Mock).mockResolvedValueOnce(false);
    await expect(ctrl.enrollFinish({ user: { id: 'u2' } } as ReqCtx, { token: '000000' } as VerifyTotpDto)).rejects.toBeTruthy();
  });
});
