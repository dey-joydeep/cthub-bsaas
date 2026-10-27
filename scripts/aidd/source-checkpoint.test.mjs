import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const workspace = resolve('.');
const ledger = join(workspace, 'scripts', 'aidd', 'agent-work-ledger.mjs');
const checkpoint = join(workspace, 'scripts', 'aidd', 'source-checkpoint.mjs');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function run(cwd, script, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      AIDD_LEDGER_TEST_PRIVATE_REPO: 'test/private',
      AIDD_LEDGER_TEST_LEDGER_SCRIPT: ledger,
    },
  });
  return { ...result, value: result.status === 0 ? JSON.parse(result.stdout) : null };
}

function success(cwd, script, ...args) {
  const result = run(cwd, script, ...args);
  assert.equal(result.status, 0, result.stderr);
  return result.value;
}

test('private source checkpoint restores an unpushed branch and uncommitted source without changing the original index', (t) => {
  const root = mkdtempSync(join(workspace, 'tmp', 'aidd-source-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  const fresh = join(root, 'fresh');
  mkdirSync(work);
  git(root, 'init', '--bare', origin);
  git(work, 'init', '-b', 'main');
  git(work, 'config', 'user.name', 'Test');
  git(work, 'config', 'user.email', 'test@example.invalid');
  git(work, 'config', 'core.autocrlf', 'false');
  writeFileSync(join(work, '.gitignore'), 'tmp/\n');
  mkdirSync(join(work, 'src'));
  writeFileSync(join(work, 'src', 'feature.txt'), 'original\n');
  git(work, 'add', '.');
  git(work, 'commit', '-m', 'initial');
  git(work, 'remote', 'add', 'origin', origin);
  git(work, 'push', 'origin', 'main');
  git(work, 'switch', '-c', 'feature');
  writeFileSync(join(work, 'src', 'feature.txt'), 'changed\n');
  writeFileSync(join(work, 'src', 'new.txt'), 'new\n');
  success(work, ledger, 'init', '--task', 'issue-9', '--goal', 'Restore source', '--base', 'main', '--issue', '9');
  success(
    work,
    ledger,
    'add',
    '--task',
    'issue-9',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'dev',
    '--paths',
    'src',
    '--acceptance',
    'Source ready',
  );
  const beforeHead = git(work, 'rev-parse', 'HEAD');
  const beforeIndex = git(work, 'write-tree');
  const result = success(work, checkpoint, 'apply', 'issue-9');
  assert.equal(result.written, true);
  assert.equal(git(work, 'rev-parse', 'HEAD'), beforeHead);
  assert.equal(git(work, 'write-tree'), beforeIndex);
  assert.equal(git(work, 'branch', '--show-current'), 'feature');
  assert.equal(git(work, 'ls-remote', 'origin', result.ref).split('\t')[0], result.commit);
  assert.equal(success(work, checkpoint, 'apply', 'issue-9').written, false);

  git(root, 'clone', origin, fresh);
  git(fresh, 'config', 'core.autocrlf', 'false');
  git(fresh, 'fetch', 'origin', result.ref);
  git(fresh, 'switch', '-c', 'feature', 'FETCH_HEAD^1');
  git(fresh, 'restore', '--source', 'FETCH_HEAD', '--staged', '--worktree', '--', '.');
  git(fresh, 'reset');
  assert.equal(readFileSync(join(fresh, 'src', 'feature.txt'), 'utf8'), 'changed\n');
  assert.equal(readFileSync(join(fresh, 'src', 'new.txt'), 'utf8'), 'new\n');
  const restored = success(fresh, ledger, 'import', '--task', 'issue-9');
  assert.equal(restored.branch, 'feature');
  assert.equal(restored.units[0].status, 'pending');
});

test('private source checkpoint rejects sensitive untracked paths', (t) => {
  const root = mkdtempSync(join(workspace, 'tmp', 'aidd-source-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  mkdirSync(work);
  git(root, 'init', '--bare', origin);
  git(work, 'init', '-b', 'main');
  git(work, 'config', 'user.name', 'Test');
  git(work, 'config', 'user.email', 'test@example.invalid');
  writeFileSync(join(work, '.gitignore'), 'tmp/\n');
  git(work, 'add', '.');
  git(work, 'commit', '-m', 'initial');
  git(work, 'remote', 'add', 'origin', origin);
  writeFileSync(join(work, '.env.local'), 'secret=value\n');
  success(work, ledger, 'init', '--task', 'issue-8', '--goal', 'Check sensitive path', '--base', 'main');
  const result = run(work, checkpoint, 'preview', 'issue-8');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sensitive path: .env.local/);
});
