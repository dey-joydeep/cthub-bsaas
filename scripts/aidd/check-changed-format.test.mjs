import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const workspace = resolve('.');
const fixtureRoot = join(workspace, 'tmp');
const script = join(workspace, 'scripts', 'aidd', 'check-changed-format.mjs');
mkdirSync(fixtureRoot, { recursive: true });

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

test('checks only changed supported files and respects the Prettier ignore list', (t) => {
  const cwd = mkdtempSync(join(fixtureRoot, 'aidd-format-test-'));
  const pathFromFixtureRoot = relative(fixtureRoot, cwd);
  assert.ok(pathFromFixtureRoot && pathFromFixtureRoot !== '..' && !pathFromFixtureRoot.startsWith(`..${sep}`));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'core.autocrlf', 'false');
  writeFileSync(join(cwd, '.prettierignore'), 'ignored.md\n');
  writeFileSync(join(cwd, 'old.md'), '# Old\n');
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'base');
  git(cwd, 'switch', '-c', 'feature');
  rmSync(join(cwd, 'old.md'));
  writeFileSync(join(cwd, 'bad.mjs'), 'const   value=1\n');
  writeFileSync(join(cwd, 'ignored.md'), '#Bad\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-m', 'change');
  const failed = spawnSync(process.execPath, [script, 'main', 'HEAD'], { cwd, encoding: 'utf8' });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /bad\.mjs/);
  assert.doesNotMatch(failed.stderr, /ignored\.md/);
  writeFileSync(join(cwd, 'bad.mjs'), 'const value = 1;\n');
  git(cwd, 'add', 'bad.mjs');
  git(cwd, 'commit', '-m', 'format');
  const passed = spawnSync(process.execPath, [script, 'main', 'HEAD'], { cwd, encoding: 'utf8' });
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /Prettier checked 1 of 2 changed paths/);
  assert.equal(readFileSync(join(cwd, 'ignored.md'), 'utf8'), '#Bad\n');
  writeFileSync(join(cwd, 'new.mjs'), 'const   next=2\n');
  const worktreeFailure = spawnSync(process.execPath, [script, '--worktree'], { cwd, encoding: 'utf8' });
  assert.equal(worktreeFailure.status, 1);
  assert.match(worktreeFailure.stderr, /new\.mjs/);
  writeFileSync(join(cwd, 'new.mjs'), 'const next = 2;\n');
  const worktreePass = spawnSync(process.execPath, [script, '--worktree'], { cwd, encoding: 'utf8' });
  assert.equal(worktreePass.status, 0, worktreePass.stderr);
  assert.match(worktreePass.stdout, /Prettier checked 1 of 1 changed paths/);
});
