ALTER TABLE "audit_event"
ADD COLUMN "target_id" UUID;

CREATE UNIQUE INDEX "audit_event_idempotency_replay_key"
ON "audit_event" ("user_id", "tenant_id", "action", "correlation_id")
WHERE "correlation_id" IS NOT NULL
  AND "action" IN ('salon_owner.business.create.idempotency', 'salon_owner.branch.create.idempotency');
