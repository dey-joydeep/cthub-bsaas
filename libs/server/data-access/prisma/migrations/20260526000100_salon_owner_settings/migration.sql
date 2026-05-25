-- CreateEnum
CREATE TYPE "public"."SalonOwnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."salon_business" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "status" "public"."SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salon_branch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salon_branch_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "timezone" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open" BOOLEAN NOT NULL,
    "intervals" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_branch_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salon_branch_holiday" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "intervals" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_branch_holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salon_branch_policy" (
    "branch_id" UUID NOT NULL,
    "booking_lead_minutes" INTEGER NOT NULL,
    "cancellation_cutoff_minutes" INTEGER NOT NULL,
    "no_show_grace_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_branch_policy_pkey" PRIMARY KEY ("branch_id")
);

-- CreateIndex
CREATE INDEX "salon_business_tenant_id_status_idx" ON "public"."salon_business"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "salon_business_tenant_id_display_name_key" ON "public"."salon_business"("tenant_id", "display_name");

-- CreateIndex
CREATE INDEX "salon_branch_business_id_idx" ON "public"."salon_branch"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "salon_branch_business_id_name_key" ON "public"."salon_branch"("business_id", "name");

-- CreateIndex
CREATE INDEX "salon_branch_hours_branch_id_idx" ON "public"."salon_branch_hours"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "salon_branch_hours_branch_id_day_of_week_key" ON "public"."salon_branch_hours"("branch_id", "day_of_week");

-- CreateIndex
CREATE INDEX "salon_branch_holiday_branch_id_idx" ON "public"."salon_branch_holiday"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "salon_branch_holiday_branch_id_date_key" ON "public"."salon_branch_holiday"("branch_id", "date");

-- AddForeignKey
ALTER TABLE "public"."salon_business" ADD CONSTRAINT "salon_business_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."salon_tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salon_branch" ADD CONSTRAINT "salon_branch_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salon_branch_hours" ADD CONSTRAINT "salon_branch_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salon_branch_holiday" ADD CONSTRAINT "salon_branch_holiday_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salon_branch_policy" ADD CONSTRAINT "salon_branch_policy_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
