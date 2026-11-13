-- CreateEnum
CREATE TYPE "public"."StaffGender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StaffEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "public"."StaffPayoutMethod" AS ENUM ('BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "public"."StaffBankAccountType" AS ENUM ('ORDINARY', 'CURRENT');

-- CreateEnum
CREATE TYPE "public"."StaffDocumentType" AS ENUM ('DRIVERS_LICENSE', 'RESIDENCE_CARD', 'PASSPORT', 'MY_NUMBER_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StaffDocVerificationStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."salon_owner_staff" ADD COLUMN "user_id" UUID;

-- CreateTable
CREATE TABLE "public"."staff_personal_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "legal_name" TEXT,
    "date_of_birth" DATE,
    "gender" "public"."StaffGender",
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT DEFAULT 'JP',
    "emergency_contact_name" TEXT,
    "emergency_contact_relationship" TEXT,
    "emergency_contact_phone" TEXT,
    "employment_type" "public"."StaffEmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "hire_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termination_date" DATE,
    "payout_method" "public"."StaffPayoutMethod" NOT NULL DEFAULT 'CASH',
    "bank_name" TEXT,
    "branch_name" TEXT,
    "branch_code" TEXT,
    "account_type" "public"."StaffBankAccountType",
    "account_number" TEXT,
    "account_holder_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_personal_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_identity_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "document_type" "public"."StaffDocumentType" NOT NULL,
    "file_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "verification_status" "public"."StaffDocVerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_identity_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_personal_profile_staff_id_key" ON "public"."staff_personal_profile"("staff_id");

-- CreateIndex
CREATE INDEX "staff_identity_document_staff_id_idx" ON "public"."staff_identity_document"("staff_id");

-- CreateIndex
CREATE INDEX "staff_identity_document_staff_id_verification_status_idx" ON "public"."staff_identity_document"("staff_id", "verification_status");

-- CreateIndex
CREATE INDEX "salon_owner_staff_user_id_idx" ON "public"."salon_owner_staff"("user_id");

-- AddForeignKey
ALTER TABLE "public"."staff_personal_profile" ADD CONSTRAINT "staff_personal_profile_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_identity_document" ADD CONSTRAINT "staff_identity_document_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
