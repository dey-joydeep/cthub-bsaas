-- Allow multiple operational salon rows for the same owner and keep branch-backed salons optional on phone.
DROP INDEX IF EXISTS "public"."salon_owner_id_key";

ALTER TABLE "public"."salon"
  ALTER COLUMN "phone" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "salon_owner_id_idx" ON "public"."salon"("owner_id");
