import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const workspace = resolve('.');
const fixtureRoot = join(workspace, 'tmp');
const setupScript = join(workspace, '.codex', 'environments', 'setup.mjs');
mkdirSync(fixtureRoot, { recursive: true });

function fixture(t, withLockfile) {
  const cwd = mkdtempSync(join(fixtureRoot, 'codex-setup-test-'));
  assert.ok(resolve(cwd).startsWith(`${resolve(fixtureRoot)}${sep}`));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'package.json'), '{"private":true}');
  if (withLockfile) writeFileSync(join(cwd, 'package-lock.json'), '{"lockfileVersion":3}');
  return cwd;
}

test('fresh worktree dry run uses the lockfile and disables install scripts', (t) => {
  const cwd = fixture(t, true);
  const result = spawnSync(process.execPath, [setupScript, '--dry-run'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ci --ignore-scripts --no-audit --fund=false/);
  if (process.platform === 'win32') assert.match(result.stdout, /npm-cli\.js ci/);
  assert.match(result.stdout, /scripts\/check-versions\/node-version\.js/);
  assert.match(result.stdout, /\.husky\/install\.mjs/);
  assert.match(result.stdout, /scripts\/aidd\/smoke-installed-toolchain\.mjs/);
});

test('fresh worktree without a lockfile cannot install', (t) => {
  const cwd = fixture(t, false);
  const result = spawnSync(process.execPath, [setupScript, '--dry-run'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /package-lock\.json not found/);
  assert.doesNotMatch(result.stdout, /Running:/);
});

test('Windows npm launcher works without invoking a package script', { skip: process.platform !== 'win32' }, () => {
  const cli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const result = spawnSync(process.execPath, [cli, '--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});
