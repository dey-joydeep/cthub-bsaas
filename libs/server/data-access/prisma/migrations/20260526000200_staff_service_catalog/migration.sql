CREATE TABLE "salon_owner_staff" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL,
  "display_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "status" "SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_staff_branch" (
  "staff_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  CONSTRAINT "salon_owner_staff_branch_pkey" PRIMARY KEY ("staff_id", "branch_id")
);

CREATE TABLE "salon_owner_staff_shift" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staff_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "timezone" TEXT NOT NULL,
  "days" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_staff_shift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_staff_leave_block" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staff_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salon_owner_staff_leave_block_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_service_category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_service_category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_service" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
  "base_price" DECIMAL(10,2) NOT NULL,
  "tax_rate_percent" DECIMAL(5,2) NOT NULL,
  "status" "SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_staff_skill" (
  "staff_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  CONSTRAINT "salon_owner_staff_skill_pkey" PRIMARY KEY ("staff_id", "service_id")
);

CREATE TABLE "salon_owner_service_staff_eligibility" (
  "service_id" UUID NOT NULL,
  "staff_id" UUID NOT NULL,
  CONSTRAINT "salon_owner_service_staff_eligibility_pkey" PRIMARY KEY ("service_id", "staff_id")
);

CREATE UNIQUE INDEX "salon_owner_staff_business_id_phone_key" ON "salon_owner_staff"("business_id", "phone");
CREATE INDEX "salon_owner_staff_business_id_status_idx" ON "salon_owner_staff"("business_id", "status");
CREATE INDEX "salon_owner_staff_branch_branch_id_idx" ON "salon_owner_staff_branch"("branch_id");
CREATE UNIQUE INDEX "salon_owner_staff_shift_staff_id_branch_id_key" ON "salon_owner_staff_shift"("staff_id", "branch_id");
CREATE INDEX "salon_owner_staff_shift_branch_id_idx" ON "salon_owner_staff_shift"("branch_id");
CREATE INDEX "salon_owner_staff_leave_block_staff_id_starts_at_idx" ON "salon_owner_staff_leave_block"("staff_id", "starts_at");
CREATE INDEX "salon_owner_staff_leave_block_branch_id_starts_at_idx" ON "salon_owner_staff_leave_block"("branch_id", "starts_at");
CREATE UNIQUE INDEX "salon_owner_service_category_business_id_name_key" ON "salon_owner_service_category"("business_id", "name");
CREATE INDEX "salon_owner_service_category_business_id_sort_order_idx" ON "salon_owner_service_category"("business_id", "sort_order");
CREATE UNIQUE INDEX "salon_owner_service_business_id_category_id_name_key" ON "salon_owner_service"("business_id", "category_id", "name");
CREATE INDEX "salon_owner_service_business_id_status_idx" ON "salon_owner_service"("business_id", "status");
CREATE INDEX "salon_owner_staff_skill_service_id_idx" ON "salon_owner_staff_skill"("service_id");
CREATE INDEX "salon_owner_service_staff_eligibility_staff_id_idx" ON "salon_owner_service_staff_eligibility"("staff_id");

ALTER TABLE "salon_owner_staff"
  ADD CONSTRAINT "salon_owner_staff_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_staff_branch"
  ADD CONSTRAINT "salon_owner_staff_branch_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_staff_branch_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_staff_shift"
  ADD CONSTRAINT "salon_owner_staff_shift_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_staff_shift_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_staff_leave_block"
  ADD CONSTRAINT "salon_owner_staff_leave_block_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_staff_leave_block_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_service_category"
  ADD CONSTRAINT "salon_owner_service_category_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_service"
  ADD CONSTRAINT "salon_owner_service_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_service_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "salon_owner_service_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "salon_owner_staff_skill"
  ADD CONSTRAINT "salon_owner_staff_skill_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_staff_skill_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "salon_owner_service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_service_staff_eligibility"
  ADD CONSTRAINT "salon_owner_service_staff_eligibility_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "salon_owner_service"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_service_staff_eligibility_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
