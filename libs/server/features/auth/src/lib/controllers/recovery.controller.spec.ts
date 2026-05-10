import { RecoveryController } from './recovery.controller';
import type { RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from '../services/audit.service';
import { BadRequestException } from '@nestjs/common';

function makeAudit(): jest.Mocked<Pick<AuditService, 'log'>> {
  return ({ log: jest.fn() } as unknown) as jest.Mocked<Pick<AuditService, 'log'>>;
}

describe('RecoveryController (unit)', () => {
  let controller: RecoveryController;
  let recovery: jest.Mocked<Pick<RecoveryCodesPort, 'generate' | 'verifyAndConsume'>>;
  let audit: jest.Mocked<Pick<AuditService, 'log'>>;

  beforeEach(() => {
    recovery = {
      generate: jest.fn((_userId: string, _count: number) => Promise.resolve(['a', 'b', 'c'])),
      verifyAndConsume: jest.fn((_userId: string, _code: string) => Promise.resolve(true)),
    } as unknown as typeof recovery;
    audit = makeAudit();
    controller = new RecoveryController(recovery as unknown as RecoveryCodesPort, audit as unknown as AuditService);
  });

  it('generateRecovery returns codes and logs event', async () => {
    const out = await controller.generateRecovery({ user: { userId: 'u1' } });
    expect(recovery.generate).toHaveBeenCalledWith('u1', 10);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    expect(audit.log).toHaveBeenCalledWith('recovery_codes_generated', { userId: 'u1', count: out.length });
  });

  it('verifyRecovery returns success and logs on success', async () => {
    recovery.verifyAndConsume.mockResolvedValueOnce(true);
    const out = await controller.verifyRecovery({ code: 'ok' }, { user: { userId: 'u1' } });
    expect(out).toEqual({ success: true });
    expect(audit.log).toHaveBeenCalledWith('recovery_code_verify_success', { userId: 'u1' });
  });

  it('verifyRecovery throws BadRequest on failure and logs failure', async () => {
    recovery.verifyAndConsume.mockResolvedValueOnce(false);
    await expect(controller.verifyRecovery({ code: 'bad' }, { user: { userId: 'u1' } })).rejects.toThrow(BadRequestException);
    expect(audit.log).toHaveBeenCalledWith('recovery_code_verify_failure', { userId: 'u1' });
  });
});
