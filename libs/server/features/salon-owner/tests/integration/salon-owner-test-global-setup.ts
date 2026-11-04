import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { bindTestDatabaseTarget } from '@cthub-bsaas/server-core';

function findWorkspaceRoot(): string {
  let directory = process.cwd();
  while (!existsSync(resolve(directory, '.env.test')) || !existsSync(resolve(directory, 'libs/server/data-access/prisma/schema.prisma'))) {
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Cannot find the test database fixture');
    directory = parent;
  }
  return directory;
}

export default async function globalSetup(): Promise<void> {
  const root = findWorkspaceRoot();
  if (process.env['NODE_ENV'] && process.env['NODE_ENV'] !== 'test') {
    throw new Error('Salon-owner integration tests require NODE_ENV=test');
  }
  process.env['NODE_ENV'] = 'test';
  const target = bindTestDatabaseTarget(process.env, root);
  const schema = resolve(root, 'libs/server/data-access/prisma/schema.prisma');
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, ['prisma', 'migrate', 'deploy', '--schema', schema], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: target.url },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error('Failed to migrate the validated test database');

  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'audit_event_idempotency_replay_key'
    `;
    if (indexes.length !== 1) throw new Error('The test database is missing the idempotency replay index');
  } finally {
    await prisma.$disconnect();
  }
}
