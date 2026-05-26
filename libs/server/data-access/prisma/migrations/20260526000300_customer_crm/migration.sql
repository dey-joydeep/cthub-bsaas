CREATE TABLE "salon_owner_customer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL,
  "display_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "date_of_birth" DATE,
  "consent_for_marketing" BOOLEAN NOT NULL DEFAULT false,
  "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
  "email_enabled" BOOLEAN NOT NULL DEFAULT false,
  "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_customer_note" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "visibility" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salon_owner_customer_note_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "salon_owner_customer_business_id_phone_key" ON "salon_owner_customer"("business_id", "phone");
CREATE INDEX "salon_owner_customer_business_id_display_name_idx" ON "salon_owner_customer"("business_id", "display_name");
CREATE INDEX "salon_owner_customer_business_id_email_idx" ON "salon_owner_customer"("business_id", "email");
CREATE INDEX "salon_owner_customer_note_customer_id_created_at_idx" ON "salon_owner_customer_note"("customer_id", "created_at");

ALTER TABLE "salon_owner_customer"
  ADD CONSTRAINT "salon_owner_customer_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_customer_note"
  ADD CONSTRAINT "salon_owner_customer_note_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "salon_owner_customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
