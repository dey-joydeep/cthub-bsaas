CREATE TYPE "SalonOwnerAppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE "salon_owner_appointment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "status" "SalonOwnerAppointmentStatus" NOT NULL DEFAULT 'BOOKED',
  "notes" TEXT,
  "estimated_wait_minutes" INTEGER,
  "reschedule_reason" TEXT,
  "cancellation_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_appointment_line" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "appointment_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "staff_id" UUID NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "service_name" TEXT NOT NULL,
  "staff_name" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salon_owner_appointment_line_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "salon_owner_appointment_branch_id_status_idx" ON "salon_owner_appointment"("branch_id", "status");
CREATE INDEX "salon_owner_appointment_customer_id_idx" ON "salon_owner_appointment"("customer_id");
CREATE INDEX "salon_owner_appointment_line_appointment_id_idx" ON "salon_owner_appointment_line"("appointment_id");
CREATE INDEX "salon_owner_appointment_line_staff_id_starts_at_ends_at_idx" ON "salon_owner_appointment_line"("staff_id", "starts_at", "ends_at");
CREATE INDEX "salon_owner_appointment_line_service_id_idx" ON "salon_owner_appointment_line"("service_id");

ALTER TABLE "salon_owner_appointment"
  ADD CONSTRAINT "salon_owner_appointment_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_appointment_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "salon_owner_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "salon_owner_appointment_line"
  ADD CONSTRAINT "salon_owner_appointment_line_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "salon_owner_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_appointment_line_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "salon_owner_service"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_appointment_line_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "salon_owner_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
