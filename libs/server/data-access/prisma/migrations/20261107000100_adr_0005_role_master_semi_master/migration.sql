-- CreateTable
CREATE TABLE "public"."permission_master" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_master_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."role_master" (
    "code" TEXT NOT NULL,
    "default_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_system_role" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_master_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."role_master_permission" (
    "role_code" TEXT NOT NULL,
    "permission_code" TEXT NOT NULL,

    CONSTRAINT "role_master_permission_pkey" PRIMARY KEY ("role_code","permission_code")
);

-- CreateTable
CREATE TABLE "public"."business_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "role_code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_role_permission" (
    "business_role_id" UUID NOT NULL,
    "permission_code" TEXT NOT NULL,

    CONSTRAINT "business_role_permission_pkey" PRIMARY KEY ("business_role_id","permission_code")
);

-- CreateTable
CREATE TABLE "public"."staff_role_assignment" (
    "staff_id" UUID NOT NULL,
    "business_role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_role_assignment_pkey" PRIMARY KEY ("staff_id","business_role_id")
);

-- CreateIndex
CREATE INDEX "role_master_permission_permission_code_idx" ON "public"."role_master_permission"("permission_code");

-- CreateIndex
CREATE INDEX "business_role_business_id_is_active_idx" ON "public"."business_role"("business_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "business_role_business_id_name_key" ON "public"."business_role"("business_id", "name");

-- CreateIndex
CREATE INDEX "business_role_permission_permission_code_idx" ON "public"."business_role_permission"("permission_code");

-- CreateIndex
CREATE INDEX "staff_role_assignment_business_role_id_idx" ON "public"."staff_role_assignment"("business_role_id");

-- AddForeignKey
ALTER TABLE "public"."role_master_permission" ADD CONSTRAINT "role_master_permission_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "public"."role_master"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_master_permission" ADD CONSTRAINT "role_master_permission_permission_code_fkey" FOREIGN KEY ("permission_code") REFERENCES "public"."permission_master"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_role" ADD CONSTRAINT "business_role_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_role_permission" ADD CONSTRAINT "business_role_permission_business_role_id_fkey" FOREIGN KEY ("business_role_id") REFERENCES "public"."business_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_role_permission" ADD CONSTRAINT "business_role_permission_permission_code_fkey" FOREIGN KEY ("permission_code") REFERENCES "public"."permission_master"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_role_assignment" ADD CONSTRAINT "staff_role_assignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."salon_owner_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_role_assignment" ADD CONSTRAINT "staff_role_assignment_business_role_id_fkey" FOREIGN KEY ("business_role_id") REFERENCES "public"."business_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
