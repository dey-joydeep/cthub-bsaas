-- Drop redundant service staff eligibility table (consolidated into salon_owner_staff_skill)
DROP TABLE IF EXISTS "salon_owner_service_staff_eligibility" CASCADE;

-- Allow personal/business-wide staff leave blocks (branch_id nullable)
ALTER TABLE "salon_owner_staff_leave_block" ALTER COLUMN "branch_id" DROP NOT NULL;

-- Optimize leave range queries with compound start/end indexes
DROP INDEX IF EXISTS "salon_owner_staff_leave_block_staff_id_starts_at_idx";
DROP INDEX IF EXISTS "salon_owner_staff_leave_block_branch_id_starts_at_idx";
CREATE INDEX "salon_owner_staff_leave_block_staff_id_starts_at_ends_at_idx" ON "salon_owner_staff_leave_block"("staff_id", "starts_at", "ends_at");
CREATE INDEX "salon_owner_staff_leave_block_branch_id_starts_at_ends_at_idx" ON "salon_owner_staff_leave_block"("branch_id", "starts_at", "ends_at");

-- Add foreign key index for category lookups on services
CREATE INDEX "salon_owner_service_category_id_idx" ON "salon_owner_service"("category_id");
