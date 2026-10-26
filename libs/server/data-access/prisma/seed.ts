import { PrismaClient } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const roles = Object.values(UserRole).map((name) => ({ name }));

  await prisma.role.createMany({
    data: roles,
    skipDuplicates: true, // This will silently skip records that already exist
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
