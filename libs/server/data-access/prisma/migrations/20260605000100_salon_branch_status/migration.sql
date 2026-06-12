ALTER TABLE "salon_branch" ADD COLUMN "status" "SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "salon_branch" AS branch
SET "status" = CASE
  WHEN salon."is_active" THEN 'ACTIVE'::"SalonOwnerStatus"
  ELSE 'INACTIVE'::"SalonOwnerStatus"
END
FROM "salon" AS salon
WHERE branch."id" = salon."id";

CREATE INDEX "salon_branch_business_id_status_idx" ON "salon_branch"("business_id", "status");
