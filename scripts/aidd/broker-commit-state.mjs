import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function gitBytes(...args) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing --${name}`);
  return process.argv[index + 1];
}

function names(buffer) {
  return buffer.toString('utf8').split('\0').filter(Boolean);
}

function verifyRepo(branch) {
  if (git('remote', 'get-url', 'origin') !== 'https://github.com/dey-joydeep/cthub-bsaas.git') {
    throw new Error('Unexpected Git remote');
  }
  if (git('branch', '--show-current') !== branch) throw new Error('Checkout is not the task branch');
  if (!/^(feature|fix|chore|docs|test|refactor|style|ci)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(branch)) {
    throw new Error('Invalid task branch');
  }
}

async function prepare() {
  const branch = option('branch');
  verifyRepo(branch);
  const all = names(gitBytes('diff', '--cached', '--name-only', '-z'));
  const allowed = names(gitBytes('diff', '--cached', '--name-only', '--diff-filter=AM', '-z'));
  if (!all.length || all.length > 20 || all.length !== allowed.length || all.some((name, index) => name !== allowed[index])) {
    throw new Error('Stage 1-20 added or modified regular text files only');
  }
  const files = all.map((path) => {
    const entry = git('ls-files', '--stage', '--', path);
    if (!entry.startsWith('100644 ')) throw new Error(`Unsupported staged file mode: ${path}`);
    const bytes = gitBytes('show', `:${path}`);
    if (bytes.byteLength > 150000) throw new Error(`Staged file too large: ${path}`);
    if (bytes.includes(0)) throw new Error(`Binary staged file forbidden: ${path}`);
    return { path, contents: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes) };
  });
  const input = {
    issueNumber: Number(option('issue')),
    branch,
    expectedHeadOid: git('rev-parse', 'HEAD'),
    message: option('message'),
    files,
  };
  if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) throw new Error('Invalid issue number');
  const path = resolve(git('rev-parse', '--git-path', 'aidd-broker/commit-input.json'));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(input)}\n`, { encoding: 'utf8', mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ inputFile: path, expectedHeadOid: input.expectedHeadOid, paths: all })}\n`);
}

async function sync() {
  const branch = option('branch');
  verifyRepo(branch);
  const input = JSON.parse(await readFile(resolve(option('input')), 'utf8'));
  const receipt = JSON.parse(await readFile(resolve(option('receipt')), 'utf8'));
  if (
    input.branch !== branch ||
    git('rev-parse', 'HEAD') !== input.expectedHeadOid ||
    !/^[a-f0-9]{40}$/.test(receipt.oid ?? '') ||
    receipt.action !== 'dev.commit' ||
    receipt.actor !== 'shearflow-dev[bot]'
  ) {
    throw new Error('Checkout or broker receipt does not match the prepared commit');
  }
  const staged = names(gitBytes('diff', '--cached', '--name-only', '-z'));
  if (JSON.stringify(staged) !== JSON.stringify(input.files.map((file) => file.path))) {
    throw new Error('Staged paths changed since broker commit');
  }
  for (const file of input.files) {
    const prepared = Buffer.from(file.contents, 'utf8');
    if (!gitBytes('show', `:${file.path}`).equals(prepared)) {
      throw new Error(`Staged contents changed since broker commit: ${file.path}`);
    }
  }
  git('fetch', 'origin', `refs/heads/${branch}`);
  if (git('rev-parse', 'FETCH_HEAD') !== receipt.oid) throw new Error('Remote branch head differs from broker receipt');
  const author = execFileSync('gh', ['api', `repos/dey-joydeep/cthub-bsaas/commits/${receipt.oid}`, '--jq', '.author.login'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (author !== 'shearflow-dev[bot]') throw new Error('Remote commit was not authored by the Dev App');
  git('reset', '--mixed', 'FETCH_HEAD');
  process.stdout.write(`${JSON.stringify({ branch, head: receipt.oid, synced: true })}\n`);
}

const command = process.argv[2];
try {
  if (command === 'prepare') await prepare();
  else if (command === 'sync') await sync();
  else throw new Error('Use prepare or sync with named options');
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
