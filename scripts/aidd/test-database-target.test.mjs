import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { bindTestDatabaseTarget, resolveTestDatabaseTarget } from '../../libs/server/core/src/config/test-database-target.ts';

const testUrl = 'postgresql://bsaas_test:secret@localhost:55432/bsaas_test?schema=public';

test('Jest global hooks resolve the database guard without test-only package aliases', () => {
  for (const hook of ['global-setup.ts', 'global-teardown.ts']) {
    const hookPath = resolve('libs/server/server-testing-utils/src/lib', hook);
    const source = readFileSync(hookPath, 'utf8');
    const guardImport = source.match(/import \{ bindTestDatabaseTarget \} from '([^']+)'/);
    assert.ok(guardImport, `${hook} must import the database guard`);
    const guard = createRequire(hookPath)(guardImport[1]);
    assert.equal(typeof guard.bindTestDatabaseTarget, 'function');
    const target = guard.bindTestDatabaseTarget({ NODE_ENV: 'test', TEST_DATABASE_URL: testUrl });
    assert.equal(target.database, 'bsaas_test');
  }
});

test('binds the same explicit test target for CLI and Prisma clients', () => {
  const env = { NODE_ENV: 'test', DATABASE_URL: 'postgresql://owner:secret@localhost:5432/bsaas', TEST_DATABASE_URL: testUrl };
  const target = bindTestDatabaseTarget(env);
  assert.equal(target.database, 'bsaas_test');
  assert.equal(env.DATABASE_URL, testUrl);
  assert.equal(env.TEST_DATABASE_URL, testUrl);
});

test('ignores an inherited database URL when the tracked test configuration supplies the target', () => {
  const target = resolveTestDatabaseTarget({ NODE_ENV: 'test', DATABASE_URL: 'postgresql://owner:secret@localhost:5432/bsaas' });
  assert.equal(target.database, 'bsaas_test');
});

test('rejects production, staging, and unapproved remote targets', () => {
  for (const url of [
    'postgresql://bsaas_test:secret@localhost:55432/bsaas',
    'postgresql://bsaas_test:secret@localhost:55432/bsaas_staging',
    'postgresql://bsaas_test:secret@database.example:55432/bsaas_test',
    'postgresql://postgres:secret@localhost:55432/bsaas_test',
  ]) {
    assert.throws(() => resolveTestDatabaseTarget({ NODE_ENV: 'test', TEST_DATABASE_URL: url }));
  }
});

test('requires test mode and an explicit allowlist for a remote test host', () => {
  assert.throws(() => resolveTestDatabaseTarget({ NODE_ENV: 'production', TEST_DATABASE_URL: testUrl }));
  const target = resolveTestDatabaseTarget({
    NODE_ENV: 'test',
    TEST_DATABASE_URL: 'postgresql://bsaas_test:secret@test-db.example:5432/bsaas_test',
    TEST_DATABASE_ALLOWED_HOSTS: 'test-db.example',
  });
  assert.equal(target.host, 'test-db.example');
});
