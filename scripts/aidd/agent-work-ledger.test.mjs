import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { runLedger } from './agent-work-ledger.mjs';
import { runSourceCheckpoint } from './source-checkpoint.mjs';

const workspace = resolve('.');
const fixtureRoot = join(workspace, 'tmp');
const ledgerScript = join(workspace, 'scripts', 'aidd', 'agent-work-ledger.mjs');
mkdirSync(fixtureRoot, { recursive: true });

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function fixture(t) {
  const cwd = mkdtempSync(join(fixtureRoot, 'aidd-ledger-test-'));
  const rel = relative(fixtureRoot, cwd);
  assert.ok(rel && rel !== '..' && !rel.startsWith(`..${sep}`));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'user.name', 'Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'core.autocrlf', 'false');
  writeFileSync(join(cwd, '.gitignore'), 'tmp/\n');
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'src', 'feature.txt'), 'initial\n');
  git(cwd, 'add', '.');
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Initial fixture');
  return cwd;
}

function runWithEnv(cwd, env, ...args) {
  const result = spawnSync(process.execPath, [ledgerScript, ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
  return { ...result, state: result.status === 0 ? JSON.parse(result.stdout) : undefined };
}

function run(cwd, ...args) {
  return runWithEnv(cwd, {}, ...args);
}

function success(cwd, ...args) {
  const result = run(cwd, ...args);
  assert.equal(result.status, 0, result.stderr);
  return result.state;
}

async function runWithMock(cwd, env, ...args) {
  try {
    const state = await runLedger(args, {
      cwd,
      gh: (_root, ghArgs, input) => {
        const result = spawnSync(process.execPath, [env.AIDD_LEDGER_TEST_GH, ...ghArgs], {
          cwd,
          input,
          encoding: 'utf8',
          env: { ...process.env, ...env },
        });
        if (result.status !== 0) throw new Error(result.stderr);
        return JSON.parse(result.stdout);
      },
    });
    return { status: 0, state };
  } catch (error) {
    return { status: 1, stderr: error.message };
  }
}

async function successWithMock(cwd, env, ...args) {
  const result = await runWithMock(cwd, env, ...args);
  assert.equal(result.status, 0, result.stderr);
  return result.state;
}

function report(cwd, value) {
  const path = join(cwd, 'tmp', 'report.json');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value));
  return 'tmp/report.json';
}

function evidence(overrides = {}) {
  return {
    summary: 'Checked the bounded work and its acceptance criteria.',
    remainingPaths: [],
    evidence: ['src/feature.txt'],
    commands: [{ command: 'fixture check', exitCode: 0 }],
    findings: [],
    ...overrides,
  };
}

test('quota pause preserves the session and checkpoint without redispatching until resumed', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-2', '--goal', 'Review fixture', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-2',
    '--unit',
    'qa',
    '--kind',
    'qa',
    '--owner',
    'qa-agent',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'QA evidence',
  );
  success(cwd, 'start', '--task', 'issue-2', '--unit', 'qa', '--provider', 'codex', '--model', 'gpt-6.1-sol');
  success(cwd, 'session', '--task', 'issue-2', '--unit', 'qa', '--id', 'session-12345678');
  const checkpoint = report(cwd, evidence({ remainingPaths: ['src/feature.txt'] }));
  success(cwd, 'checkpoint', '--task', 'issue-2', '--unit', 'qa', '--report', checkpoint);
  let state = success(
    cwd,
    'quota-pause',
    '--task',
    'issue-2',
    '--unit',
    'qa',
    '--reason',
    'Provider usage limit',
    '--resume-after',
    '2026-11-03T00:00:00Z',
  );
  assert.equal(state.units[0].status, 'quota-paused');
  assert.equal(state.units[0].invocation.sessionId, 'session-12345678');
  assert.equal(state.units[0].checkpoint.remainingPaths[0], 'src/feature.txt');
  assert.deepEqual(state.readyUnits, []);
  assert.equal(run(cwd, 'start', '--task', 'issue-2', '--unit', 'qa').status, 1);
  state = success(cwd, 'recover', '--task', 'issue-2');
  assert.equal(state.units[0].status, 'quota-paused');
  const exported = success(cwd, 'export', '--task', 'issue-2');
  assert.equal(exported.units[0].status, 'quota-paused');
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-2'), { recursive: true });
  state = success(cwd, 'import', '--task', 'issue-2');
  assert.equal(state.units[0].status, 'quota-paused');
  assert.equal(state.units[0].invocation.sessionId, 'session-12345678');
  assert.deepEqual(state.readyUnits, []);
  state = success(cwd, 'resume', '--task', 'issue-2', '--unit', 'qa');
  assert.deepEqual(state.readyUnits, ['qa']);
});

test('imported interruption preserves the provider conversation for continuation', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-3', '--goal', 'Recover interrupted work', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-3',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Recover the provider session',
  );
  success(cwd, 'start', '--task', 'issue-3', '--unit', 'build', '--provider', 'antigravity', '--model', 'gemini-3.8-flash');
  success(cwd, 'session', '--task', 'issue-3', '--unit', 'build', '--id', 'conversation-12345678');
  const checkpoint = report(cwd, evidence({ remainingPaths: ['src/feature.txt'] }));
  success(cwd, 'checkpoint', '--task', 'issue-3', '--unit', 'build', '--report', checkpoint);
  success(cwd, 'interrupt', '--task', 'issue-3', '--unit', 'build');
  success(cwd, 'export', '--task', 'issue-3');
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-3'), { recursive: true });
  const imported = success(cwd, 'import', '--task', 'issue-3');
  assert.equal(imported.units[0].status, 'interrupted');
  assert.deepEqual(imported.units[0].invocation, {
    provider: 'antigravity',
    model: 'gemini-3.8-flash',
    sessionId: 'conversation-12345678',
  });
  assert.equal(imported.units[0].checkpoint.remainingPaths[0], 'src/feature.txt');
  const exportedAgain = success(cwd, 'export', '--task', 'issue-3');
  assert.deepEqual(exportedAgain.units[0].invocation, imported.units[0].invocation);
});

test('interruption retains a checkpoint, recovery is idempotent, and changed source invalidates completion', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-1', '--goal', 'Deliver fixture', '--base', 'main');
  success(cwd, 'init', '--task', 'issue-1', '--goal', 'Deliver fixture', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-1',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Feature is checked',
  );
  success(
    cwd,
    'add',
    '--task',
    'issue-1',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Feature is checked',
  );
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'build');
  const checkpoint = report(cwd, evidence({ remainingPaths: ['src/feature.txt'] }));
  success(cwd, 'checkpoint', '--task', 'issue-1', '--unit', 'build', '--report', checkpoint);
  assert.equal(run(cwd, 'start', '--task', 'issue-1', '--unit', 'build').status, 1);
  let state = success(cwd, 'recover', '--task', 'issue-1');
  assert.equal(state.units[0].status, 'interrupted');
  assert.equal(state.units[0].checkpoint.remainingPaths[0], 'src/feature.txt');
  assert.deepEqual(state.readyUnits, ['build']);
  const eventDir = join(cwd, 'tmp', 'aidd-ledger', 'issue-1', 'events', 'build');
  const before = git(cwd, 'status', '--short');
  state = success(cwd, 'recover', '--task', 'issue-1');
  assert.equal(state.units[0].status, 'interrupted');
  assert.equal(git(cwd, 'status', '--short'), before);
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'build');
  const finalReport = report(cwd, evidence());
  state = success(cwd, 'complete', '--task', 'issue-1', '--unit', 'build', '--report', finalReport);
  assert.equal(state.units[0].status, 'complete');
  success(
    cwd,
    'add',
    '--task',
    'issue-1',
    '--unit',
    'handoff',
    '--kind',
    'handoff',
    '--owner',
    'coordinator',
    '--paths',
    '.gitignore',
    '--depends',
    'build',
    '--acceptance',
    'Handoff cites the completed build',
  );
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'handoff');
  success(cwd, 'complete', '--task', 'issue-1', '--unit', 'handoff', '--report', finalReport);
  success(
    cwd,
    'add',
    '--task',
    'issue-1',
    '--unit',
    'a-final',
    '--kind',
    'handoff',
    '--owner',
    'release',
    '--paths',
    '.gitignore',
    '--depends',
    'handoff',
    '--acceptance',
    'Final handoff cites validated dependencies',
  );
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'a-final');
  success(cwd, 'complete', '--task', 'issue-1', '--unit', 'a-final', '--report', finalReport);
  assert.ok(readdirSync(eventDir).filter((name) => name.endsWith('.json')).length >= 5);
  const exported = success(cwd, 'export', '--task', 'issue-1');
  assert.equal(exported.snapshot, 'docs/status/aidd/issue-1.json');
  assert.equal(JSON.parse(readFileSync(join(cwd, exported.snapshot), 'utf8')).version, 1);
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-1'), { recursive: true, force: true });
  state = success(cwd, 'import', '--task', 'issue-1');
  assert.equal(state.units.find((unit) => unit.id === 'a-final').status, 'complete');
  writeFileSync(join(cwd, 'src', 'feature.txt'), 'changed\n');
  state = success(cwd, 'status', '--task', 'issue-1');
  assert.equal(state.units.find((unit) => unit.id === 'build').status, 'stale');
  assert.equal(state.units.find((unit) => unit.id === 'handoff').status, 'stale');
  assert.equal(state.units.find((unit) => unit.id === 'a-final').status, 'stale');
  assert.deepEqual(state.readyUnits, ['build']);
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'build');
  state = success(cwd, 'complete', '--task', 'issue-1', '--unit', 'build', '--report', finalReport);
  assert.equal(state.units.find((unit) => unit.id === 'build').status, 'complete');
  assert.equal(state.units.find((unit) => unit.id === 'handoff').status, 'stale');
  assert.equal(state.units.find((unit) => unit.id === 'a-final').status, 'stale');
  assert.deepEqual(state.readyUnits, ['handoff']);
  success(cwd, 'export', '--task', 'issue-1');
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-1'), { recursive: true, force: true });
  state = success(cwd, 'import', '--task', 'issue-1');
  assert.equal(state.units.find((unit) => unit.id === 'handoff').status, 'stale');
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'handoff');
  state = success(cwd, 'complete', '--task', 'issue-1', '--unit', 'handoff', '--report', finalReport);
  assert.equal(state.units.find((unit) => unit.id === 'handoff').status, 'complete');
  assert.equal(state.units.find((unit) => unit.id === 'a-final').status, 'stale');
  success(cwd, 'start', '--task', 'issue-1', '--unit', 'a-final');
  state = success(cwd, 'complete', '--task', 'issue-1', '--unit', 'a-final', '--report', finalReport);
  assert.equal(state.units.find((unit) => unit.id === 'a-final').status, 'complete');
});

test('superseding a stale unit requires a completed successor and survives export and import', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-4', '--goal', 'Replace obsolete work', '--base', 'main');
  for (const unit of ['obsolete', 'replacement']) {
    success(
      cwd,
      'add',
      '--task',
      'issue-4',
      '--unit',
      unit,
      '--kind',
      'implementation',
      '--owner',
      'dev',
      '--paths',
      'src/feature.txt',
      '--acceptance',
      `${unit} done`,
    );
  }
  success(cwd, 'start', '--task', 'issue-4', '--unit', 'obsolete');
  const finalReport = report(cwd, evidence());
  success(cwd, 'complete', '--task', 'issue-4', '--unit', 'obsolete', '--report', finalReport);
  writeFileSync(join(cwd, 'src', 'feature.txt'), 'replacement\n');
  assert.equal(run(cwd, 'supersede', '--task', 'issue-4', '--unit', 'obsolete', '--by', 'replacement', '--reason', 'Replaced').status, 1);
  success(cwd, 'start', '--task', 'issue-4', '--unit', 'replacement');
  success(cwd, 'complete', '--task', 'issue-4', '--unit', 'replacement', '--report', finalReport);
  const state = success(cwd, 'supersede', '--task', 'issue-4', '--unit', 'obsolete', '--by', 'replacement', '--reason', 'Replaced');
  assert.equal(state.units.find((unit) => unit.id === 'obsolete').status, 'superseded');
  assert.deepEqual(state.readyUnits, []);
  success(cwd, 'export', '--task', 'issue-4');
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-4'), { recursive: true, force: true });
  const imported = success(cwd, 'import', '--task', 'issue-4');
  assert.equal(imported.units.find((unit) => unit.id === 'obsolete').status, 'superseded');
  assert.deepEqual(imported.readyUnits, []);
});

test('final review requires a clean whole-PR boundary and becomes stale after a new commit', (t) => {
  const cwd = fixture(t);
  git(cwd, 'switch', '-c', 'feature');
  writeFileSync(join(cwd, 'src', 'feature.txt'), 'delivered\n');
  git(cwd, 'add', '.');
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Deliver fixture');
  success(cwd, 'init', '--task', 'issue-2', '--goal', 'Review fixture', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-2',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Feature is checked',
  );
  success(cwd, 'start', '--task', 'issue-2', '--unit', 'build');
  success(cwd, 'complete', '--task', 'issue-2', '--unit', 'build', '--report', report(cwd, evidence()));
  success(
    cwd,
    'add',
    '--task',
    'issue-2',
    '--unit',
    'review',
    '--kind',
    'review',
    '--owner',
    'codex-reviewer',
    '--paths',
    '.',
    '--depends',
    'build',
    '--acceptance',
    'Whole PR passes independent review',
  );
  success(cwd, 'start', '--task', 'issue-2', '--unit', 'review');
  const reviewedHead = git(cwd, 'rev-parse', 'HEAD');
  const reviewedBase = git(cwd, 'merge-base', 'main', 'HEAD');
  const reviewedBaseTip = git(cwd, 'rev-parse', 'main');
  const closureOnly = report(
    cwd,
    evidence({
      review: { reviewer: 'codex-reviewer', reviewedBase, reviewedBaseTip, reviewedHead, scope: 'finding-closure', verdict: 'pass' },
    }),
  );
  assert.equal(run(cwd, 'complete', '--task', 'issue-2', '--unit', 'review', '--report', closureOnly).status, 1);
  const reviewReport = report(
    cwd,
    evidence({ review: { reviewer: 'codex-reviewer', reviewedBase, reviewedBaseTip, reviewedHead, scope: 'whole-pr', verdict: 'pass' } }),
  );
  let state = success(cwd, 'complete', '--task', 'issue-2', '--unit', 'review', '--report', reviewReport);
  assert.equal(state.units.find((unit) => unit.id === 'review').status, 'complete');
  writeFileSync(join(cwd, 'README.md'), 'unrelated new commit\n');
  git(cwd, 'add', '.');
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Change head');
  state = success(cwd, 'status', '--task', 'issue-2');
  assert.equal(state.units.find((unit) => unit.id === 'build').status, 'complete');
  assert.equal(state.units.find((unit) => unit.id === 'review').status, 'stale');
  git(cwd, 'switch', 'main');
  const wrongBranch = run(cwd, 'status', '--task', 'issue-2');
  assert.equal(wrongBranch.status, 1);
  assert.match(wrongBranch.stderr, /belongs to branch feature/);
});

test('review cannot approve its own implementation through a QA handoff', (t) => {
  const cwd = fixture(t);
  git(cwd, 'switch', '-c', 'feature');
  writeFileSync(join(cwd, 'src', 'feature.txt'), 'delivered\n');
  git(cwd, 'add', '.');
  git(cwd, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Deliver fixture');
  success(cwd, 'init', '--task', 'issue-review-owner', '--goal', 'Review independently', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-review-owner',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'codex-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Feature delivered',
  );
  success(cwd, 'start', '--task', 'issue-review-owner', '--unit', 'build');
  success(cwd, 'complete', '--task', 'issue-review-owner', '--unit', 'build', '--report', report(cwd, evidence()));
  success(
    cwd,
    'add',
    '--task',
    'issue-review-owner',
    '--unit',
    'qa',
    '--kind',
    'qa',
    '--owner',
    'qa-agent',
    '--paths',
    'src/feature.txt',
    '--depends',
    'build',
    '--acceptance',
    'Feature tested',
  );
  success(cwd, 'start', '--task', 'issue-review-owner', '--unit', 'qa');
  success(cwd, 'complete', '--task', 'issue-review-owner', '--unit', 'qa', '--report', report(cwd, evidence()));
  const reviewedHead = git(cwd, 'rev-parse', 'HEAD');
  const reviewedBase = git(cwd, 'merge-base', 'main', 'HEAD');
  const reviewedBaseTip = git(cwd, 'rev-parse', 'main');
  for (const [unit, owner] of [
    ['self-review', 'codex-dev'],
    ['independent-review', 'codex-reviewer'],
  ]) {
    success(
      cwd,
      'add',
      '--task',
      'issue-review-owner',
      '--unit',
      unit,
      '--kind',
      'review',
      '--owner',
      owner,
      '--paths',
      '.',
      '--depends',
      'qa',
      '--acceptance',
      'Whole PR reviewed independently',
    );
    success(cwd, 'start', '--task', 'issue-review-owner', '--unit', unit);
    const reviewReport = report(
      cwd,
      evidence({ review: { reviewer: owner, reviewedBase, reviewedBaseTip, reviewedHead, scope: 'whole-pr', verdict: 'pass' } }),
    );
    const result = run(cwd, 'complete', '--task', 'issue-review-owner', '--unit', unit, '--report', reviewReport);
    if (unit === 'self-review') {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /review of their own implementation/);
    } else {
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.state.units.find((entry) => entry.id === unit).status, 'complete');
    }
  }
});

test('failed validation cannot complete a unit and leaves prior progress intact', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-3', '--goal', 'Validate fixture', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-3',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Checks pass',
  );
  success(cwd, 'start', '--task', 'issue-3', '--unit', 'build');
  const failedReport = report(cwd, evidence({ commands: [{ command: 'fixture check', exitCode: 1 }] }));
  const result = run(cwd, 'complete', '--task', 'issue-3', '--unit', 'build', '--report', failedReport);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /failed commands/);
  const state = success(cwd, 'status', '--task', 'issue-3');
  assert.equal(state.units[0].status, 'running');
});

test('forked events fail closed without discarding either writer', (t) => {
  const cwd = fixture(t);
  success(cwd, 'init', '--task', 'issue-4', '--goal', 'Detect concurrent writes', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-4',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'No lost events',
  );
  success(cwd, 'start', '--task', 'issue-4', '--unit', 'build');
  const directory = join(cwd, 'tmp', 'aidd-ledger', 'issue-4', 'events', 'build');
  const id = randomUUID();
  writeFileSync(
    join(directory, `${id}.json`),
    JSON.stringify({ id, unit: 'build', previous: null, type: 'interrupt', at: new Date().toISOString() }),
  );
  const result = run(cwd, 'recover', '--task', 'issue-4');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Forked event history/);
  assert.equal(readdirSync(directory).filter((name) => name.endsWith('.json')).length, 2);
});

test('private issue checkpoint publishes idempotently and restores on another checkout state', async (t) => {
  const cwd = fixture(t);
  const origin = join(cwd, 'tmp', 'origin.git');
  git(cwd, 'init', '--bare', origin);
  git(cwd, 'remote', 'add', 'origin', origin);
  git(cwd, 'push', 'origin', 'main');
  const mockPath = join(cwd, 'tmp', 'mock-gh.mjs');
  const remotePath = join(cwd, 'tmp', 'remote.json');
  mkdirSync(dirname(mockPath), { recursive: true });
  writeFileSync(
    mockPath,
    `
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const path = process.env.AIDD_LEDGER_TEST_REMOTE_STATE;
const state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { comments: [] };
const endpoint = args.find((part) => part.startsWith('repos/')) ?? '';
function output(value) { process.stdout.write(JSON.stringify(value)); }
if (args[0] === 'repo') output({ isPrivate: process.env.AIDD_LEDGER_TEST_PUBLIC !== '1', nameWithOwner: 'corp/private' });
else if (args[1] === 'user') output({ login: 'tester' });
else if (endpoint.includes('?per_page=')) output([state.comments]);
else if (args.includes('-X')) {
  const body = JSON.parse(readFileSync(0, 'utf8')).body;
  const id = args.includes('POST') ? state.comments.length + 1 : Number(endpoint.split('/').at(-1));
  const comment = { id, body, user: { login: 'tester' }, html_url: 'https://github.com/corp/private/issues/67#issuecomment-' + id };
  const index = state.comments.findIndex((entry) => entry.id === id);
  if (index < 0) state.comments.push(comment); else state.comments[index] = comment;
  writeFileSync(path, JSON.stringify(state));
  output(comment);
} else output(state.comments.find((entry) => entry.id === Number(endpoint.split('/').at(-1))));
`,
  );
  const env = { NODE_ENV: 'test', AIDD_LEDGER_TEST_GH: mockPath, AIDD_LEDGER_TEST_REMOTE_STATE: remotePath };
  success(cwd, 'init', '--task', 'issue-67', '--goal', 'Remote fixture', '--issue', '67', '--base', 'main');
  success(
    cwd,
    'add',
    '--task',
    'issue-67',
    '--unit',
    'build',
    '--kind',
    'implementation',
    '--owner',
    'agy-dev',
    '--paths',
    'src/feature.txt',
    '--acceptance',
    'Source is checked',
  );
  success(cwd, 'start', '--task', 'issue-67', '--unit', 'build');
  success(cwd, 'complete', '--task', 'issue-67', '--unit', 'build', '--report', report(cwd, evidence()));
  const sourceOptions = {
    cwd,
    ledgerScript,
    verifyPrivateRepository: () => ({ name: 'corp/private', pushUrl: origin }),
  };
  const sourcePreview = runSourceCheckpoint('preview', 'issue-67', undefined, sourceOptions);
  runSourceCheckpoint('apply', 'issue-67', sourcePreview.tree, sourceOptions);
  success(
    cwd,
    'add',
    '--task',
    'issue-67',
    '--unit',
    'qa',
    '--kind',
    'qa',
    '--owner',
    'qa-agent',
    '--paths',
    'src/feature.txt',
    '--depends',
    'build',
    '--acceptance',
    'QA checks source',
  );
  const mismatched = await runWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'preview');
  assert.equal(mismatched.status, 1);
  assert.match(mismatched.stderr, /Source checkpoint snapshot differs/);
  const refreshedSource = runSourceCheckpoint('preview', 'issue-67', undefined, sourceOptions);
  const sourceCheckpoint = runSourceCheckpoint('apply', 'issue-67', refreshedSource.tree, sourceOptions);
  let state = await successWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'preview');
  assert.equal(state.remote.written, false);
  assert.equal(state.remote.action, 'create');
  assert.equal(existsSync(remotePath), false);
  state = await successWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'apply');
  assert.equal(state.remote.written, true);
  assert.match(JSON.parse(readFileSync(remotePath, 'utf8')).comments[0].body, new RegExp(`Source checkpoint: ${sourceCheckpoint.commit}`));
  assert.equal(state.remoteCurrent, true);
  state = await successWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'apply');
  assert.equal(state.remote.written, false);
  assert.equal(JSON.parse(readFileSync(remotePath, 'utf8')).comments.length, 1);
  rmSync(join(cwd, 'tmp', 'aidd-ledger', 'issue-67'), { recursive: true, force: true });
  state = await successWithMock(cwd, env, 'restore', '--task', 'issue-67', '--issue', '67');
  assert.equal(state.units[0].status, 'complete');
  assert.equal(state.remoteCurrent, true);
  const snapshotPath = join(cwd, 'docs', 'status', 'aidd', 'issue-67.json');
  const originalSnapshot = readFileSync(snapshotPath, 'utf8');
  writeFileSync(snapshotPath, `${originalSnapshot} `);
  const localConflict = await runWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'preview');
  assert.equal(localConflict.status, 1);
  assert.match(localConflict.stderr, /Tracked snapshot changed outside the ledger/);
  writeFileSync(snapshotPath, originalSnapshot);
  const publicResult = await runWithMock(
    cwd,
    { ...env, AIDD_LEDGER_TEST_PUBLIC: '1' },
    'publish',
    '--task',
    'issue-67',
    '--mode',
    'preview',
  );
  assert.equal(publicResult.status, 1);
  assert.match(publicResult.stderr, /private GitHub repository/);
  const remote = JSON.parse(readFileSync(remotePath, 'utf8'));
  const priorBody = remote.comments[0].body;
  const priorEncoded = priorBody.match(/<!-- cthub-aidd-data:([A-Za-z0-9+/=]+) -->/)[1];
  const altered = JSON.parse(Buffer.from(priorEncoded, 'base64').toString('utf8'));
  altered.exportedAt = '2099-01-01T00:00:00.000Z';
  const alteredContent = JSON.stringify(altered);
  const alteredDigest = createHash('sha256').update(alteredContent).digest('hex');
  remote.comments[0].body = priorBody
    .replace(/<!-- cthub-aidd-sha256:[a-f0-9]{64} -->/, `<!-- cthub-aidd-sha256:${alteredDigest} -->`)
    .replace(priorEncoded, Buffer.from(alteredContent).toString('base64'));
  writeFileSync(remotePath, JSON.stringify(remote));
  state = await successWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'preview');
  assert.equal(state.remote.safeToApply, false);
  const conflict = await runWithMock(cwd, env, 'publish', '--task', 'issue-67', '--mode', 'apply');
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /changed or has no matching local baseline/);
});
