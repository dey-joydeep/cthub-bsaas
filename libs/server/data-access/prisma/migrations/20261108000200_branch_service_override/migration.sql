-- CreateTable
CREATE TABLE "salon_owner_branch_service_override" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "price_override" DECIMAL(10,2),
    "duration_override_minutes" INTEGER,
    "visible_online" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_owner_branch_service_override_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salon_owner_branch_service_override_branch_id_idx" ON "salon_owner_branch_service_override"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "salon_owner_branch_service_override_service_id_branch_id_key" ON "salon_owner_branch_service_override"("service_id", "branch_id");

-- AddForeignKey
ALTER TABLE "salon_owner_branch_service_override" ADD CONSTRAINT "salon_owner_branch_service_override_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "salon_owner_service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salon_owner_branch_service_override" ADD CONSTRAINT "salon_owner_branch_service_override_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
