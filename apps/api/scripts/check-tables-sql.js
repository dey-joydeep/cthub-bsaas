const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Check if salon_tenant_staff table exists
    const tenantStaffExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'salon_tenant_staff'
      );
    `;
    console.log('salon_tenant_staff table exists:', tenantStaffExists[0].exists);

    // Check if salon_staff table still exists
    const staffExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'salon_staff'
      );
    `;
    console.log('salon_staff table exists (should be false):', staffExists[0].exists);

    // Check foreign key constraints
    const fkCheck = await prisma.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND (ccu.table_name = 'salon_tenant_staff' OR ccu.table_name = 'salon_staff');
    `;

    console.log('\nForeign key constraints involving staff tables:');
    console.table(fkCheck);
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
