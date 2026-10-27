#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function fail(message) {
  throw new Error(message);
}

function command(program, args, cwd, options = {}) {
  const result = spawnSync(program, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) fail(`${program} ${args[0]} failed: ${result.error?.message ?? result.stderr?.trim()}`);
  return result.stdout.trim();
}

function git(root, args, options) {
  return command('git', args, root, options);
}

function repository(root) {
  const value = JSON.parse(command('gh', ['repo', 'view', '--json', 'nameWithOwner,isPrivate'], root));
  if (value.isPrivate !== true || !/^[^/]+\/[^/]+$/.test(value.nameWithOwner ?? '')) {
    fail('Source checkpoints require an authenticated private GitHub repository');
  }
  return { name: value.nameWithOwner, pushUrl: verifiedPushUrl(root, value.nameWithOwner) };
}

export function verifiedPushUrl(root, repositoryName) {
  const target = repositoryName.toLowerCase();
  const acceptable = new Set([`git@github.com:${target}`, `https://github.com/${target}`]);
  const fetchUrl = git(root, ['remote', 'get-url', 'origin'])
    .toLowerCase()
    .replace(/\.git$/, '');
  const pushUrls = git(root, ['remote', 'get-url', '--push', '--all', 'origin']).split(/\r?\n/).filter(Boolean);
  if (pushUrls.length !== 1 || !acceptable.has(fetchUrl) || !acceptable.has(pushUrls[0].toLowerCase().replace(/\.git$/, ''))) {
    fail('origin fetch and push destinations must both match the authenticated private GitHub repository');
  }
  return pushUrls[0];
}

function remoteTip(root, ref) {
  const lines = git(root, ['ls-remote', 'origin', ref]).split('\n').filter(Boolean);
  if (lines.length > 1) fail(`Ambiguous remote checkpoint ref ${ref}`);
  return lines.length ? lines[0].split('\t')[0] : null;
}

function changedFiles(root, index) {
  return git(root, ['diff', '--cached', '--name-only', '-z', 'HEAD'], { env: { ...process.env, GIT_INDEX_FILE: index } })
    .split('\0')
    .filter(Boolean);
}

function assertNoSensitivePaths(files) {
  for (const file of files) {
    const name = file.split('/').at(-1).toLowerCase();
    if (
      (/^\.env(?:\.|$)/.test(name) && !/^\.env\.(?:example|template|sample)$/.test(name)) ||
      /\.(?:pem|p12|pfx|key|keystore)$/.test(name) ||
      /^(?:id_rsa|id_ed25519|credentials(?:\.|$)|service-account(?:\.|$))/.test(name)
    ) {
      fail(`Checkpoint includes a sensitive path: ${file}`);
    }
  }
}

function assertNoSensitiveContent(root, index, files) {
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const pattern = /-----BEGIN [^-]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/;
  for (const file of files) {
    const object = git(root, ['ls-files', '-s', '--', file], { env });
    if (!object) continue; // Deletion.
    const match = object.match(/^\d+ ([a-f0-9]{40,64}) 0\t/);
    if (!match) fail(`Unmerged or unsupported index entry: ${file}`);
    const size = Number(git(root, ['cat-file', '-s', match[1]]));
    if (size > 2 * 1024 * 1024) fail(`Checkpoint cannot safely scan changed blob over 2 MiB: ${file}`);
    const content = execFileSync('git', ['cat-file', 'blob', match[1]], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 3 * 1024 * 1024,
    });
    if (content.includes('\0')) fail(`Checkpoint cannot safely scan binary content in ${file}`);
    if (pattern.test(content)) fail(`Checkpoint includes a likely secret in ${file}`);
  }
}

function inspectUnpushedHistory(root) {
  git(root, ['fetch', '--prune', '--no-tags', 'origin']);
  const objects = git(root, ['rev-list', '--objects', 'HEAD', '--not', '--remotes=origin']).split(/\r?\n/).filter(Boolean);
  for (const entry of objects) {
    const [id, ...name] = entry.split(' ');
    if (git(root, ['cat-file', '-t', id]) !== 'blob') continue;
    const file = name.join(' ');
    if (file) assertNoSensitivePaths([file]);
    const size = Number(git(root, ['cat-file', '-s', id]));
    if (size > 2 * 1024 * 1024) fail(`Checkpoint cannot safely scan unpushed blob over 2 MiB: ${file || id}`);
    const content = execFileSync('git', ['cat-file', 'blob', id], { cwd: root, encoding: 'utf8', maxBuffer: 3 * 1024 * 1024 });
    if (content.includes('\0')) fail(`Checkpoint cannot safely scan binary content in unpushed history: ${file || id}`);
    if (/-----BEGIN [^-]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(content)) {
      fail(`Checkpoint includes a likely secret in unpushed history: ${file || id}`);
    }
  }
}

function inspectPrevious(root, ref, task, branch, previous) {
  if (!previous) return null;
  git(root, ['fetch', '--no-tags', 'origin', ref]);
  const fetched = git(root, ['rev-parse', 'FETCH_HEAD']);
  if (fetched !== previous) fail('Remote checkpoint changed during fetch; retry');
  const body = git(root, ['log', '-1', '--format=%B', fetched]);
  if (!body.includes(`AIDD-Task: ${task}`) || !body.includes(`AIDD-Branch: ${branch}`)) {
    fail('Existing remote checkpoint belongs to a different task or branch');
  }
  return fetched;
}

export function runSourceCheckpoint(mode, task, expectedTree, dependencies = {}) {
  if (!['preview', 'apply'].includes(mode) || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(task ?? '')) {
    fail('Usage: npm run aidd:source-checkpoint -- <preview|apply> <task-id> [preview-tree]');
  }
  if (mode === 'apply' && !/^[a-f0-9]{40,64}$/.test(expectedTree ?? '')) fail('Apply requires the reviewed preview tree SHA');
  const root = resolve(git(dependencies.cwd ?? process.cwd(), ['rev-parse', '--show-toplevel']));
  const branch = git(root, ['branch', '--show-current']);
  if (!branch) fail('A source checkpoint requires a named task branch');
  const manifestPath = join(root, 'tmp', 'aidd-ledger', task, 'manifest.json');
  if (!existsSync(manifestPath)) fail(`AIDD ledger ${task} does not exist`);
  const taskManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (taskManifest.task !== task || taskManifest.root !== root || taskManifest.branch !== branch) {
    fail('AIDD ledger task, checkout, or branch does not match');
  }
  const repo = (dependencies.verifyPrivateRepository ?? repository)(root);
  const ref = `refs/aidd/checkpoints/${task}`;
  const previous = inspectPrevious(root, ref, task, branch, remoteTip(root, ref));
  inspectUnpushedHistory(root);
  // Export before building the tree so the durable snapshot and source agree.
  const ledgerScript = dependencies.ledgerScript ?? join(root, 'scripts', 'aidd', 'agent-work-ledger.mjs');
  command(process.execPath, [ledgerScript, 'export', '--task', task], root);
  const directory = join(root, 'tmp', 'aidd-ledger', task);
  mkdirSync(directory, { recursive: true });
  const index = join(directory, `source-index-${randomUUID()}`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  try {
    git(root, ['read-tree', 'HEAD'], { env });
    git(root, ['add', '-A'], { env });
    git(root, ['diff', '--cached', '--check'], { env });
    const files = changedFiles(root, index);
    assertNoSensitivePaths(files);
    assertNoSensitiveContent(root, index, files);
    const tree = git(root, ['write-tree'], { env });
    const head = git(root, ['rev-parse', 'HEAD']);
    if (mode === 'apply' && tree !== expectedTree) fail('Source changed since preview; review the new tree before applying');
    if (head !== git(root, ['rev-parse', 'HEAD'])) fail('HEAD changed during checkpoint capture');
    if (previous && git(root, ['rev-parse', `${previous}^{tree}`]) === tree && git(root, ['rev-parse', `${previous}^1`]) === head) {
      return { repository: repo, ref, commit: previous, files: files.length, written: false };
    }
    if (mode === 'preview') return { repository: repo, ref, baseHead: head, tree, changedPaths: files, written: false };
    // A temporary index and commit-tree leave the normal branch and index untouched.
    const message = `aidd checkpoint ${task}\n\nAIDD-Task: ${task}\nAIDD-Branch: ${branch}\nAIDD-Base-Head: ${head}\n`;
    const parents = ['-p', head, ...(previous ? ['-p', previous] : [])];
    const commit = git(root, ['commit-tree', tree, ...parents], { input: message });
    git(root, ['add', '-A'], { env });
    if (git(root, ['write-tree'], { env }) !== tree || git(root, ['rev-parse', 'HEAD']) !== head) {
      fail('Source or HEAD changed during checkpoint capture; review a new preview');
    }
    // Ref updates are fast-forward only. A concurrent writer makes push fail.
    git(root, ['-c', 'push.followTags=false', 'push', '--no-follow-tags', '--porcelain', repo.pushUrl, `${commit}:${ref}`]);
    if (remoteTip(root, ref) !== commit) fail('Remote source checkpoint did not verify after push');
    return { repository: repo, ref, commit, baseHead: head, files: files.length, written: true };
  } finally {
    rmSync(index, { force: true });
    rmSync(`${index}.lock`, { force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, task, expectedTree, ...extra] = process.argv.slice(2);
    if (extra.length) fail('Unexpected source checkpoint arguments');
    console.log(JSON.stringify(runSourceCheckpoint(mode, task, expectedTree), null, 2));
  } catch (error) {
    console.error(`AIDD source checkpoint: ${error.message}`);
    process.exitCode = 1;
  }
}
