import { AuditService } from './audit.service';
import type { LoggerService } from '@cthub-bsaas/server-core';
import { CorrelationId } from '@cthub-bsaas/server-core';

type LoggerMock = jest.Mocked<Pick<LoggerService, 'access'>>;

describe('AuditService', () => {
  it('logs structured audit entries', () => {
    const logger = { access: jest.fn() } as unknown as LoggerMock;
    const svc = new AuditService(logger as unknown as LoggerService);
    svc.log('event_key', { userId: 'u1', sessionId: 's1' });
    expect(logger.access).toHaveBeenCalledWith(expect.stringContaining('event_key'), 'AuthAudit');
    const payload = (logger.access.mock.calls[0]?.[0] as string) ?? '';
    expect(payload).toContain('userId');
    expect(payload).toContain('s1');
  });

  it('includes correlationId when available', () => {
    const spy = jest.spyOn(CorrelationId, 'get').mockReturnValue('cid-123');
    const logger = { access: jest.fn() } as unknown as LoggerMock;
    const svc = new AuditService(logger as unknown as LoggerService);
    svc.log('event_key', { userId: 'u2' });
    const payload = (logger.access.mock.calls[0]?.[0] as string) ?? '';
    expect(payload).toContain('cid-123');
    expect(payload).toContain('correlationId');
    spy.mockRestore();
  });
});
