import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runSourceCheckpoint, verifiedPushUrl } from './source-checkpoint.mjs';

const workspace = resolve('.');
const ledger = join(workspace, 'scripts', 'aidd', 'agent-work-ledger.mjs');
const checkpoint = join(workspace, 'scripts', 'aidd', 'source-checkpoint.mjs');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function run(cwd, script, ...args) {
  if (script === checkpoint) {
    try {
      return {
        status: 0,
        value: runSourceCheckpoint(args[0], args[1], args[2], {
          cwd,
          ledgerScript: ledger,
          verifyPrivateRepository: () => ({ name: 'test/private', pushUrl: git(cwd, 'remote', 'get-url', '--push', 'origin') }),
        }),
      };
    } catch (error) {
      return { status: 1, stderr: error.message, value: null };
    }
  }
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
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
  git(origin, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  git(work, 'tag', '-a', 'fixture-tag', '-m', 'fixture tag');
  git(work, 'config', 'push.followTags', 'true');
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
  const preview = success(work, checkpoint, 'preview', 'issue-9');
  writeFileSync(join(work, 'src', 'new.txt'), 'changed after preview\n');
  assert.match(run(work, checkpoint, 'apply', 'issue-9', preview.tree).stderr, /Source changed since preview/);
  writeFileSync(join(work, 'src', 'new.txt'), 'new\n');
  const result = success(work, checkpoint, 'apply', 'issue-9', preview.tree);
  assert.equal(result.written, true);
  assert.equal(git(work, 'rev-parse', 'HEAD'), beforeHead);
  assert.equal(git(work, 'write-tree'), beforeIndex);
  assert.equal(git(work, 'branch', '--show-current'), 'feature');
  assert.equal(git(work, 'ls-remote', 'origin', result.ref).split('\t')[0], result.commit);
  assert.equal(git(work, 'ls-remote', 'origin', 'refs/tags/fixture-tag'), '');
  assert.equal(success(work, checkpoint, 'apply', 'issue-9', preview.tree).written, false);

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

test('a different push URL is rejected before source publication', (t) => {
  const root = mkdtempSync(join(workspace, 'tmp', 'aidd-source-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-b', 'main');
  git(root, 'remote', 'add', 'origin', 'git@github.com:test/private.git');
  git(root, 'remote', 'set-url', '--push', 'origin', 'https://github.com/public/leak.git');
  assert.throws(() => verifiedPushUrl(root, 'test/private'), /fetch and push destinations/);
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

test('private source checkpoint accepts only the reviewed root test environment fixture', (t) => {
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
  copyFileSync(join(workspace, '.env.test'), join(work, '.env.test'));
  success(work, ledger, 'init', '--task', 'issue-6', '--goal', 'Check test fixture', '--base', 'main');
  success(work, checkpoint, 'preview', 'issue-6');
  writeFileSync(join(work, '.env.test'), readFileSync(join(work, '.env.test'), 'utf8').replace('test_db_password', 'other_password'));
  assert.match(run(work, checkpoint, 'preview', 'issue-6').stderr, /changed \.env\.test fixture/);
  mkdirSync(join(work, 'nested'));
  writeFileSync(join(work, 'nested', '.env.test'), 'DATABASE_URL=postgresql://unsafe\n');
  assert.match(run(work, checkpoint, 'preview', 'issue-6').stderr, /sensitive path: nested\/\.env\.test/);
});

test('private source checkpoint rejects a secret in deleted unpushed history', (t) => {
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
  git(work, 'push', 'origin', 'main');
  git(work, 'switch', '-c', 'feature');
  writeFileSync(join(work, 'secret.txt'), `${['-----BEGIN', 'PRIVATE KEY-----'].join(' ')}\nfixture\n`);
  git(work, 'add', '.');
  git(work, 'commit', '-m', 'add secret');
  rmSync(join(work, 'secret.txt'));
  git(work, 'add', '-A');
  git(work, 'commit', '-m', 'remove secret');
  success(work, ledger, 'init', '--task', 'issue-7', '--goal', 'Reject history', '--base', 'main');
  const result = run(work, checkpoint, 'preview', 'issue-7');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /likely secret in unpushed history/);
});
