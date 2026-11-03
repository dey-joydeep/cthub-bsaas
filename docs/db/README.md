# Historical Database Notes

The table, enum, and relationship notes in this folder are retained as historical product and data-model references. They are not the current database implementation contract. Some entries describe routes, files, or tables that no longer match the repository.

For a current change, start with the accepted feature specification under `docs/specs/**`, then inspect `libs/server/data-access/prisma/schema.prisma`, its migrations, and the affected repository code. The Prisma schema and migrations define the implemented database structure. Follow `docs/aidd/database-access-policy.md` before using a database tool or running a migration. Reconcile any useful rule from this folder into a current spec before relying on it for implementation.
