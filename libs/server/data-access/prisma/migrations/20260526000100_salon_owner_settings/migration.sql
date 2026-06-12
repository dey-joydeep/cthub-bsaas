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

WITH RECURSIVE ordered_salons AS (
    SELECT
        s."id" AS "salon_id",
        s."tenant_id",
        COALESCE(NULLIF(BTRIM(s."name"), ''), 'Salon') AS "salon_name",
        CASE
            WHEN s."is_active" THEN 'ACTIVE'::"public"."SalonOwnerStatus"
            ELSE 'INACTIVE'::"public"."SalonOwnerStatus"
        END AS "status",
        s."created_at",
        s."updated_at",
        ROW_NUMBER() OVER (
            PARTITION BY s."tenant_id"
            ORDER BY s."created_at", s."id"
        ) AS "tenant_order"
    FROM "public"."salon" s
),
salon_business_backfill AS (
    SELECT
        ordered."salon_id",
        ordered."tenant_id",
        ordered."salon_name",
        ordered."status",
        ordered."created_at",
        ordered."updated_at",
        ordered."tenant_order",
        ordered."salon_name" AS "display_name",
        ARRAY[ordered."salon_name"]::TEXT[] AS "used_display_names"
    FROM ordered_salons ordered
    WHERE ordered."tenant_order" = 1

    UNION ALL

    SELECT
        ordered."salon_id",
        ordered."tenant_id",
        ordered."salon_name",
        ordered."status",
        ordered."created_at",
        ordered."updated_at",
        ordered."tenant_order",
        candidate."display_name",
        previous."used_display_names" || candidate."display_name"
    FROM salon_business_backfill previous
    INNER JOIN ordered_salons ordered
        ON ordered."tenant_id" = previous."tenant_id"
       AND ordered."tenant_order" = previous."tenant_order" + 1
    CROSS JOIN LATERAL (
        SELECT
            CASE
                WHEN suffix."value" = 1 THEN ordered."salon_name"
                ELSE ordered."salon_name" || ' ' || suffix."value"::TEXT
            END AS "display_name"
        FROM GENERATE_SERIES(1, 10000) AS suffix("value")
        WHERE NOT (
            CASE
                WHEN suffix."value" = 1 THEN ordered."salon_name"
                ELSE ordered."salon_name" || ' ' || suffix."value"::TEXT
            END = ANY(previous."used_display_names")
        )
        ORDER BY suffix."value"
        LIMIT 1
    ) candidate
)
INSERT INTO "public"."salon_business" ("id", "tenant_id", "display_name", "legal_name", "status", "created_at", "updated_at")
SELECT
    backfill."salon_id",
    backfill."tenant_id",
    backfill."display_name",
    backfill."salon_name",
    backfill."status",
    backfill."created_at",
    backfill."updated_at"
FROM salon_business_backfill backfill
ON CONFLICT ("id") DO NOTHING;

WITH salon_branch_backfill AS (
    SELECT
        s."id" AS "salon_id",
        COALESCE(NULLIF(BTRIM(s."name"), ''), 'Salon') AS "salon_name",
        COALESCE(NULLIF(BTRIM(s."phone"), ''), NULLIF(BTRIM(tenant."phone"), '')) AS "phone",
        NULLIF(BTRIM(s."email"), '') AS "email",
        COALESCE(NULLIF(BTRIM(s."metadata" ->> 'timezone'), ''), 'UTC') AS "timezone",
        COALESCE(NULLIF(BTRIM(country."currency"), ''), 'USD') AS "currency",
        jsonb_build_object(
            'line1', address."line1",
            'city', city."name",
            'state', state."name",
            'postalCode', address."postal_code",
            'country', country."iso2"
        ) ||
        CASE
            WHEN NULLIF(BTRIM(address."line2"), '') IS NOT NULL
                THEN jsonb_build_object('line2', BTRIM(address."line2"))
            ELSE '{}'::jsonb
        END AS "address",
        s."created_at",
        s."updated_at"
    FROM "public"."salon" s
    INNER JOIN "public"."salon_tenant" tenant ON tenant."id" = s."tenant_id"
    INNER JOIN "public"."business_address" address ON address."id" = s."business_address_id"
    INNER JOIN "public"."city" city ON city."id" = address."city_id"
    INNER JOIN "public"."state" state ON state."id" = address."state_id"
    INNER JOIN "public"."country" country ON country."id" = address."country_id"
)
INSERT INTO "public"."salon_branch" ("id", "business_id", "name", "phone", "email", "timezone", "currency", "address", "created_at", "updated_at")
SELECT
    backfill."salon_id",
    backfill."salon_id",
    backfill."salon_name",
    backfill."phone",
    backfill."email",
    backfill."timezone",
    backfill."currency",
    backfill."address",
    backfill."created_at",
    backfill."updated_at"
FROM salon_branch_backfill backfill
ON CONFLICT ("id") DO NOTHING;
