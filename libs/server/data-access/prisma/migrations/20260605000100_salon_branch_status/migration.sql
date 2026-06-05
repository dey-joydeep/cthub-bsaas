ALTER TABLE "salon_branch" ADD COLUMN "status" "SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "salon_branch_business_id_status_idx" ON "salon_branch"("business_id", "status");
