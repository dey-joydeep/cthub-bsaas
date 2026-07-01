WITH ranked_city AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY country_id, state_id, LOWER(name)
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank,
    FIRST_VALUE(id) OVER (
      PARTITION BY country_id, state_id, LOWER(name)
      ORDER BY created_at ASC, id ASC
    ) AS canonical_id
  FROM "city"
),
duplicate_city AS (
  SELECT id, canonical_id
  FROM ranked_city
  WHERE duplicate_rank > 1
),
repointed_address AS (
  UPDATE "business_address" AS business_address
  SET "city_id" = duplicate_city.canonical_id
  FROM duplicate_city
  WHERE business_address."city_id" = duplicate_city.id
  RETURNING business_address.id
)
DELETE FROM "city" AS city
USING duplicate_city
WHERE city.id = duplicate_city.id;

CREATE UNIQUE INDEX "city_country_id_state_id_name_ci_key"
ON "city" ("country_id", "state_id", LOWER("name"));

ALTER TABLE "city"
ADD CONSTRAINT "city_country_id_state_id_name_key" UNIQUE ("country_id", "state_id", "name");
