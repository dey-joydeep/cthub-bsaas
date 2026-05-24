import { AUDIT_PORT } from './audit.port';
import type { AuditPort, AuditRecordInput } from './audit.port';

describe('audit port contract', () => {
  it('exports a stable DI token and typed record contract', async () => {
    const events: AuditRecordInput[] = [];
    const port: AuditPort = {
      record(input) {
        events.push(input);
        return Promise.resolve();
      },
    };

    expect(AUDIT_PORT.description).toBe('AUDIT_PORT');

    await port.record({
      actorType: 'owner',
      actorUserId: 'user-1',
      scope: { tenantId: 'tenant-1', businessId: 'business-1', branchId: 'branch-1' },
      action: 'business.settings.updated',
      targetType: 'business',
      targetId: 'business-1',
      correlationId: 'c-123',
      metadata: { changed: true },
    });

    expect(events).toEqual([
      expect.objectContaining({
        actorType: 'owner',
        action: 'business.settings.updated',
        correlationId: 'c-123',
      }),
    ]);
  });
});
