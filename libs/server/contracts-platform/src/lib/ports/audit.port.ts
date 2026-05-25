export const AUDIT_PORT = Symbol('AUDIT_PORT');

export type AuditActorType = 'platform' | 'owner' | 'staff' | 'customer' | 'system' | 'anonymous';

export interface AuditScope {
  readonly tenantId?: string;
  readonly businessId?: string;
  readonly branchId?: string;
}

export interface AuditSnapshot {
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
}

export interface AuditRecordInput {
  readonly actorUserId?: string;
  readonly actorType: AuditActorType;
  readonly scope?: AuditScope;
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string;
  readonly result?: 'success' | 'failure' | 'denied';
  readonly reason?: string;
  readonly correlationId?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly snapshot?: AuditSnapshot;
  readonly metadata?: Record<string, unknown>;
  readonly occurredAt?: Date;
}

export interface AuditPort {
  record(input: AuditRecordInput): Promise<void>;
}
