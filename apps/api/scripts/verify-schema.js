const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySchema() {
  try {
    // Check if the tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('\n=== Database Tables ===');
    console.table(tables);

    // Check for specific tables
    const checkTable = async (tableName) => {
      const exists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        );
      `;
      return exists[0].exists;
    };

    console.log('\n=== Specific Tables ===');
    console.log('salon_staff exists:', await checkTable('salon_staff'));
    console.log('salon_tenant_staff exists:', await checkTable('salon_tenant_staff'));

    // Check _prisma_migrations table
    console.log('\n=== Applied Migrations ===');
    const migrations = await prisma.$queryRaw`
      SELECT "migration_name", "applied_steps_count" 
      FROM "_prisma_migrations" 
      ORDER BY "finished_at" DESC 
      LIMIT 5;
    `;
    console.table(migrations);
  } catch (error) {
    console.error('Error verifying schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
