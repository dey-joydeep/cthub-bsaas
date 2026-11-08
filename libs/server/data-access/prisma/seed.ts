import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  type SeedContext,
  type SeedScope,
  seedGeoCurrencies,
  seedRolesAndPermissions,
  seedAuthAndTenants,
  seedSalonAndBranches,
  seedStaffAndCatalog,
  seedCustomersCrm,
  seedTransactions,
} from './seeds';

// Automatically load environment variables for standalone execution
// Supports explicit test database targeting via --test or NODE_ENV=test
const isTestTarget = process.env['NODE_ENV'] === 'test' || process.argv.includes('--test') || Boolean(process.env['TEST_DATABASE_URL']);

if (isTestTarget && existsSync(resolve('.env.test'))) {
  process.loadEnvFile(resolve('.env.test'));
} else if (existsSync(resolve('.env.test')) && !existsSync(resolve('.env'))) {
  process.loadEnvFile(resolve('.env.test'));
} else if (existsSync(resolve('.env'))) {
  process.loadEnvFile(resolve('.env'));
}

if (process.env['TEST_DATABASE_URL']) {
  process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];
}

// Parse scope flag: --master-only | --baseline | default (all)
let scope: SeedScope = 'all';
if (process.argv.includes('--master-only')) {
  scope = 'master';
} else if (process.argv.includes('--baseline')) {
  scope = 'baseline';
}

const prisma = new PrismaClient();

async function main() {
  const dbUrl = process.env['DATABASE_URL'] ?? '';
  let dbHost = 'unknown';
  let dbName = 'unknown';
  try {
    const parsed = new URL(dbUrl);
    dbHost = parsed.host;
    dbName = parsed.pathname.replace(/^\//, '');
  } catch {
    // fallback
  }

  console.log('===============================================================');
  console.log(' CTHub Modular Database Seeder Orchestrator');
  console.log(` Target Database: ${dbName} on ${dbHost}`);
  console.log(` Target Profile:  ${dbName.includes('_test') ? 'TEST (Isolated Test DB)' : 'LOCAL (Development DB)'}`);
  console.log(` Seeding Scope:   ${scope.toUpperCase()}`);
  console.log('===============================================================');

  const context: SeedContext = {
    prisma,
    options: {
      scope,
      isTestTarget,
    },
  };

  // Phase 1: Global Reference & Master Data
  const geo = await seedGeoCurrencies(context);
  await seedRolesAndPermissions(context);

  if (scope === 'master') {
    console.log('\n✓ Master data seeding complete (--master-only flag provided).');
    return;
  }

  // Phase 2: Multi-Tenant Organizations, Auth Identity & Salon Business Baseline
  const auth = await seedAuthAndTenants(context, geo);
  const salon = await seedSalonAndBranches(context, auth);
  const staff = await seedStaffAndCatalog(context, salon);
  await seedCustomersCrm(context, salon);

  if (scope === 'baseline') {
    console.log('\n✓ Baseline business data seeding complete (--baseline flag provided).');
    return;
  }

  // Phase 3: Transactional Records & Scenarios
  await seedTransactions(context, geo, auth, salon, staff);

  console.log('\n===============================================================');
  console.log(' CTHub Modular Database Seeding Completed Successfully!');
  console.log(' Summary of Seeded Data:');
  console.log(' - Global Master: 14 System Roles, 26 Permissions, 6 Role Presets');
  console.log(' - Geography: 2 Countries, 3 States, 4 Cities, 3 Business Addresses');
  console.log(' - Identity: 7 Demo Users, 2 Salon Tenants, 2 Salon Businesses');
  console.log(' - Settings: 3 Salon Branches, Weekly Hours, Holidays, Policies');
  console.log(' - Service Catalog: 3 Categories, 5 Services (Active, Buffers, Inactive)');
  console.log(' - Staff Roster: 6 Staff Profiles, Multi-branch Assignments, Skills, Shifts');
  console.log(' - CRM: 2 Customer Profiles, 3 Clinical/VIP Notes');
  console.log(' - Transactions: 4 Leave Blocks, 4 Appointments, 2 Coupons & Redemptions');
  console.log('===============================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
