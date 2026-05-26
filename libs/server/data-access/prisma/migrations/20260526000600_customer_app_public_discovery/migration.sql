-- Customer app durable state for favorites and submitted reviews.

CREATE TABLE "customer_favorite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "label" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_favorite_user_id_target_type_target_id_key" ON "customer_favorite"("user_id", "target_type", "target_id");
CREATE INDEX "customer_favorite_user_id_target_type_idx" ON "customer_favorite"("user_id", "target_type");

CREATE UNIQUE INDEX "customer_review_user_id_appointment_id_key" ON "customer_review"("user_id", "appointment_id");
CREATE INDEX "customer_review_appointment_id_idx" ON "customer_review"("appointment_id");
CREATE INDEX "customer_review_status_idx" ON "customer_review"("status");

ALTER TABLE "customer_favorite" ADD CONSTRAINT "customer_favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_review" ADD CONSTRAINT "customer_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_review" ADD CONSTRAINT "customer_review_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "salon_owner_appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
