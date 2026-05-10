# Prisma Migration & Database Management Commands

## 1. Drop all tables in the database
```sql
-- WARNING: This will delete all data
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
    END LOOP;
END $$;
```
*Run this in pgAdmin’s Query Tool or in psql connected to the target database.*

---

## 2. Delete Prisma migration folder
```powershell
# PowerShell
Remove-Item -Recurse -Force prisma\migrations

# Bash
rm -rf prisma/migrations
```
*Removes all local migration history so you can start fresh.*

---

## 3. Create initial migration SQL (without applying)
```powershell
npx prisma migrate dev --name init --create-only --schema prisma/schema.prisma
```
- Creates `prisma/migrations/<timestamp>_init/migration.sql`.
- Does **not** apply it to the database.

---

## 4. Create tables in the DB (apply migration)
```powershell
npx prisma migrate dev --name init --schema prisma/schema.prisma
```
- Creates a migration (if not already created).
- Applies the migration SQL to the database.
- Updates `_prisma_migrations` table in the DB.

---

## 5. Verification SQLs (in pgAdmin or psql)
```sql
-- Check current DB/schema
SELECT current_database() AS db, current_schema() AS schema;

-- List all tables in the public schema
SELECT schemaname, tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check applied migrations
SELECT * FROM public."_prisma_migrations"
ORDER BY finished_at DESC NULLS LAST;
```

---

## 6. Other important Prisma commands

```powershell
# Reset the DB (drop all data, re-apply all migrations, run seed if configured)
npx prisma migrate reset --schema prisma/schema.prisma

# Generate Prisma Client from current schema
npx prisma generate --schema prisma/schema.prisma

# Push schema changes directly to the DB (no migrations created)
npx prisma db push --schema prisma/schema.prisma

# View current migration status
npx prisma migrate status --schema prisma/schema.prisma

# Resolve migration drift (mark migration as applied without running SQL)
npx prisma migrate resolve --applied <migration_folder_name> --schema prisma/schema.prisma

# Seed database (from package.json or directly with dotenv)
npx prisma db seed
npx tsx -r dotenv/config prisma/seed.ts

# Open Prisma Studio for GUI access
npx prisma studio
```
---

*Tip:* Always confirm you’re connected to the **correct database** by checking `DATABASE_URL` in `.env` before running destructive commands.
