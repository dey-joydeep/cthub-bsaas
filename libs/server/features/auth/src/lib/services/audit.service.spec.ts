import { AuditService } from './audit.service';
import { Logger } from '@nestjs/common';

describe('AuditService', () => {
  it('logs structured audit entries', () => {
    const svc = new AuditService();
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    svc.log('event_key', { userId: 'u1', sessionId: 's1' });
    expect(spy).toHaveBeenCalled();
    const callArg = (spy.mock.calls[0]?.[0] as string) || '';
    expect(callArg).toContain('event_key');
    expect(callArg).toContain('userId');
    spy.mockRestore();
  });
});
