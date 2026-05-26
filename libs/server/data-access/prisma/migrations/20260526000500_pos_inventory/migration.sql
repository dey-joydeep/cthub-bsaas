CREATE TYPE "SalonOwnerInvoiceStatus" AS ENUM ('DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'VOID');

CREATE TABLE "salon_owner_invoice" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "appointment_id" UUID,
  "status" "SalonOwnerInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "due_amount" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_invoice_line" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "reference_id" UUID NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10,3) NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "line_total" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "salon_owner_invoice_line_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_invoice_payment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "method" TEXT NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL,
  "reference" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salon_owner_invoice_payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_product" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "business_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "retail_price" DECIMAL(10,2) NOT NULL,
  "reorder_point" DECIMAL(10,3),
  "status" "SalonOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "salon_owner_product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salon_owner_stock_movement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" DECIMAL(10,3) NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salon_owner_stock_movement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "salon_owner_invoice_branch_id_status_idx" ON "salon_owner_invoice"("branch_id", "status");
CREATE INDEX "salon_owner_invoice_customer_id_idx" ON "salon_owner_invoice"("customer_id");
CREATE INDEX "salon_owner_invoice_appointment_id_idx" ON "salon_owner_invoice"("appointment_id");
CREATE INDEX "salon_owner_invoice_line_invoice_id_idx" ON "salon_owner_invoice_line"("invoice_id");
CREATE INDEX "salon_owner_invoice_payment_invoice_id_idx" ON "salon_owner_invoice_payment"("invoice_id");
CREATE UNIQUE INDEX "salon_owner_product_business_id_sku_key" ON "salon_owner_product"("business_id", "sku");
CREATE INDEX "salon_owner_product_business_id_status_idx" ON "salon_owner_product"("business_id", "status");
CREATE INDEX "salon_owner_stock_movement_branch_id_product_id_idx" ON "salon_owner_stock_movement"("branch_id", "product_id");
CREATE INDEX "salon_owner_stock_movement_product_id_idx" ON "salon_owner_stock_movement"("product_id");

ALTER TABLE "salon_owner_invoice"
  ADD CONSTRAINT "salon_owner_invoice_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_invoice_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "salon_owner_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_invoice_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "salon_owner_appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "salon_owner_invoice_line"
  ADD CONSTRAINT "salon_owner_invoice_line_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "salon_owner_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_invoice_payment"
  ADD CONSTRAINT "salon_owner_invoice_payment_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "salon_owner_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_product"
  ADD CONSTRAINT "salon_owner_product_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "salon_business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "salon_owner_stock_movement"
  ADD CONSTRAINT "salon_owner_stock_movement_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "salon_branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salon_owner_stock_movement_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "salon_owner_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
