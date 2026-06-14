ALTER TABLE "audit_event"
ADD COLUMN "target_id" UUID;

CREATE UNIQUE INDEX "audit_event_user_id_tenant_id_action_correlation_id_key"
ON "audit_event" ("user_id", "tenant_id", "action", "correlation_id");
