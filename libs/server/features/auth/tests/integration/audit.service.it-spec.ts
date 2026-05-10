import { Test } from '@nestjs/testing';
import { AuditService } from '../../src/lib/services/audit.service';

describe('AuditService (integration-light)', () => {
  it('logs structured audit events', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();
    const svc = moduleRef.get(AuditService);
    // Just ensure the method is callable; logger writes to Nest logger
    expect(() => svc.log('test_event', { userId: 'u1', sessionId: 's1' })).not.toThrow();
  });
});

