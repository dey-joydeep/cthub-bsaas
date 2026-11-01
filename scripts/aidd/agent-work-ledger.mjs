#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const version = 1;
const kinds = new Set(['implementation', 'qa', 'review', 'review-closure', 'verification', 'handoff']);
const eventTypes = new Set(['start', 'checkpoint', 'complete', 'interrupt', 'supersede']);
let injectedGh = null;

function fail(message) {
  throw new Error(message);
}

function git(args, cwd = process.cwd(), encoding = 'utf8') {
  try {
    const output = execFileSync('git', args, { cwd, encoding, maxBuffer: 64 * 1024 * 1024 });
    return encoding === 'buffer' ? output : output.trim();
  } catch (error) {
    fail(`git ${args[0]} failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

function gh(root, args, input) {
  if (injectedGh) return injectedGh(root, args, input);
  const result = spawnSync('gh', args, { cwd: root, input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0)
    fail(`gh ${args.slice(0, 2).join(' ')} failed: ${result.error?.message ?? result.stderr?.trim()}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(`gh ${args.slice(0, 2).join(' ')} did not return JSON`);
  }
}

function privateRepository(root) {
  const repository = gh(root, ['repo', 'view', '--json', 'nameWithOwner,isPrivate']);
  if (repository.isPrivate !== true || !/^[^/]+\/[^/]+$/.test(repository.nameWithOwner ?? '')) {
    fail('Remote AIDD checkpoints require an authenticated private GitHub repository');
  }
  return repository.nameWithOwner;
}

function repoRoot(cwd = process.cwd()) {
  return resolve(git(['rev-parse', '--show-toplevel'], cwd));
}

function identifier(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)) {
    fail(`${label} must be lowercase letters, digits, or hyphens (max 80 characters)`);
  }
  return value;
}

function within(root, path) {
  const rel = relative(root, path);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function assertNoLinks(root, path) {
  const parts = relative(root, path).split(sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) fail(`Symbolic link is outside the ledger safety boundary: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function safePath(root, input) {
  if (!input || isAbsolute(input) || input.includes('\\')) fail(`Unsafe repository path: ${input}`);
  const path = resolve(root, input);
  if (!within(root, path) || (path !== root && !within(root, dirname(path)))) fail(`Path escapes repository: ${input}`);
  assertNoLinks(root, path);
  return path;
}

function listOption(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} needs a comma-separated value`);
  const entries = value.split(',').map((entry) => entry.trim());
  if (entries.some((entry) => !entry)) fail(`${label} contains an empty entry`);
  if (new Set(entries).size !== entries.length) fail(`${label} contains duplicates`);
  return entries;
}

function parse(argv) {
  const [command, ...rest] = argv;
  if (
    ![
      'init',
      'add',
      'start',
      'checkpoint',
      'complete',
      'interrupt',
      'supersede',
      'status',
      'recover',
      'export',
      'import',
      'publish',
      'restore',
    ].includes(command)
  ) {
    fail(
      'Usage: npm run aidd:ledger -- <init|add|start|checkpoint|complete|interrupt|supersede|status|recover|export|import|publish|restore> --task <id> [options]',
    );
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!/^--[a-z-]+$/.test(flag ?? '') || !value || value.startsWith('--')) fail(`Invalid option: ${flag ?? '(missing)'}`);
    const name = flag.slice(2);
    if (options[name] !== undefined) fail(`Duplicate option: ${flag}`);
    options[name] = value;
  }
  const allowed = {
    init: ['task', 'goal', 'issue', 'base'],
    add: ['task', 'unit', 'kind', 'owner', 'paths', 'depends', 'acceptance'],
    start: ['task', 'unit'],
    checkpoint: ['task', 'unit', 'report'],
    complete: ['task', 'unit', 'report'],
    interrupt: ['task', 'unit', 'reason'],
    supersede: ['task', 'unit', 'by', 'reason'],
    status: ['task'],
    recover: ['task'],
    export: ['task'],
    import: ['task'],
    publish: ['task', 'mode'],
    restore: ['task', 'issue'],
  }[command];
  for (const name of Object.keys(options)) if (!allowed.includes(name)) fail(`Unsupported --${name} for ${command}`);
  identifier(options.task, 'Task ID');
  return { command, options };
}

function atomicCreate(root, path, value) {
  if (!within(root, path)) fail(`Ledger path escapes repository: ${path}`);
  assertNoLinks(root, dirname(path));
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  const fd = openSync(temporary, 'wx');
  try {
    writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    linkSync(temporary, path); // Atomic create-if-absent, including on Windows.
  } finally {
    unlinkSync(temporary);
  }
}

function atomicReplace(root, path, content) {
  if (!within(root, path)) fail(`Snapshot path escapes repository: ${path}`);
  assertNoLinks(root, path);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  const fd = openSync(temporary, 'wx');
  try {
    writeFileSync(fd, content, 'utf8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function readJson(path, label) {
  let value;
  try {
    value = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${label} is missing or malformed: ${error.message}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function taskDirectory(root, task) {
  return join(root, 'tmp', 'aidd-ledger', identifier(task, 'Task ID'));
}

function snapshotPath(root, task) {
  return join(root, 'docs', 'status', 'aidd', `${identifier(task, 'Task ID')}.json`);
}

function exportStatePath(root, task) {
  return join(taskDirectory(root, task), 'export-state.json');
}

function fileDigest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function saveExportBaseline(root, task) {
  atomicReplace(root, exportStatePath(root, task), `${JSON.stringify({ digest: fileDigest(snapshotPath(root, task)) }, null, 2)}\n`);
}

function remoteStatePath(root, task) {
  return join(taskDirectory(root, task), 'remote-state.json');
}

function manifest(root, task) {
  const path = join(taskDirectory(root, task), 'manifest.json');
  safePath(root, relative(root, path).replaceAll('\\', '/'));
  const value = readJson(path, 'Task manifest');
  if (value.version !== version || value.task !== task || value.root !== root || !value.branch)
    fail('Task manifest has an unsupported version or repository');
  if (value.branch !== git(['branch', '--show-current'], root)) fail(`Task ${task} belongs to branch ${value.branch}`);
  return value;
}

function unitPath(root, task, unit) {
  return join(taskDirectory(root, task), 'units', `${identifier(unit, 'Unit ID')}.json`);
}

function readUnit(root, task, unit) {
  const path = unitPath(root, task, unit);
  safePath(root, relative(root, path).replaceAll('\\', '/'));
  const value = readJson(path, `Unit ${unit}`);
  if (
    value.id !== unit ||
    !kinds.has(value.kind) ||
    typeof value.owner !== 'string' ||
    !value.owner.trim() ||
    typeof value.acceptance !== 'string' ||
    !value.acceptance.trim() ||
    !Array.isArray(value.paths) ||
    value.paths.length === 0 ||
    !Array.isArray(value.dependsOn)
  ) {
    fail(`Unit ${unit} has an invalid schema`);
  }
  for (const file of value.paths) safePath(root, file);
  for (const dependency of value.dependsOn) identifier(dependency, 'Dependency');
  if (value.dependsOn.includes(unit)) fail(`Unit ${unit} depends on itself`);
  return value;
}

function units(root, task) {
  const directory = join(taskDirectory(root, task), 'units');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readUnit(root, task, name.slice(0, -5)));
}

function events(root, task, unit) {
  const directory = join(taskDirectory(root, task), 'events', unit);
  if (!existsSync(directory)) return [];
  const files = readdirSync(directory).filter((name) => name.endsWith('.json'));
  const entries = files.map((name) => {
    const path = join(directory, name);
    safePath(root, relative(root, path).replaceAll('\\', '/'));
    return readJson(path, `Event ${name}`);
  });
  const byId = new Map();
  for (const [index, event] of entries.entries()) {
    if (
      event.unit !== unit ||
      !eventTypes.has(event.type) ||
      typeof event.id !== 'string' ||
      `${event.id}.json` !== files[index] ||
      (event.previous !== null && typeof event.previous !== 'string') ||
      typeof event.at !== 'string'
    ) {
      fail(`Invalid event in unit ${unit}`);
    }
    if (byId.has(event.id)) fail(`Duplicate event ID in unit ${unit}`);
    byId.set(event.id, event);
  }
  if (entries.length === 0) return [];
  const children = new Map();
  let rootEvent;
  for (const event of entries) {
    if (event.previous === null) {
      if (rootEvent) fail(`Forked event history for unit ${unit}`);
      rootEvent = event;
    } else {
      if (!byId.has(event.previous) || children.has(event.previous)) fail(`Broken or forked event history for unit ${unit}`);
      children.set(event.previous, event);
    }
  }
  if (!rootEvent) fail(`No root event for unit ${unit}`);
  const ordered = [];
  for (let current = rootEvent; current; current = children.get(current.id)) {
    ordered.push(current);
    if (ordered.length > entries.length) fail(`Cycle in event history for unit ${unit}`);
  }
  if (ordered.length !== entries.length) fail(`Disconnected event history for unit ${unit}`);
  return ordered;
}

function append(root, task, unit, type, details = {}) {
  const prior = events(root, task, unit).at(-1);
  const event = {
    id: randomUUID(),
    unit,
    previous: prior?.id ?? null,
    type,
    at: new Date().toISOString(),
    ...details,
  };
  atomicCreate(root, join(taskDirectory(root, task), 'events', unit, `${event.id}.json`), event);
  events(root, task, unit); // Detect a concurrent writer instead of silently losing either event.
  return event;
}

function nulPaths(root, args) {
  return git(args, root, 'buffer').toString('utf8').split('\0').filter(Boolean);
}

function prChangedPaths(root, base) {
  return [
    ...new Set([
      ...nulPaths(root, ['diff', '--name-only', '-z', `${base}..HEAD`]),
      ...nulPaths(root, ['diff', '--name-only', '-z', 'HEAD']),
      ...nulPaths(root, ['ls-files', '-z', '--others', '--exclude-standard']),
    ]),
  ].sort();
}

function source(root, taskManifest, unit) {
  const hash = createHash('sha256');
  const head = git(['rev-parse', 'HEAD'], root);
  let base;
  let baseTip;
  if (unit.kind === 'review' || unit.kind === 'review-closure' || unit.kind === 'verification' || unit.kind === 'qa') {
    base = git(['merge-base', taskManifest.base, 'HEAD'], root);
    baseTip = git(['rev-parse', taskManifest.base], root);
    hash.update(`head:${head}\0base:${base}\0base-tip:${baseTip}\0`);
  }
  const files =
    unit.kind === 'review' && unit.paths.includes('.')
      ? prChangedPaths(root, base)
      : nulPaths(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...unit.paths]).sort();
  for (const file of files) {
    const absolute = safePath(root, file.replaceAll('\\', '/'));
    hash.update(`path:${file}\0`);
    if (!existsSync(absolute)) {
      hash.update('deleted\0');
      continue;
    }
    const stat = lstatSync(absolute);
    if (!stat.isFile()) {
      fail(`Unsupported source type: ${file}`);
    }
    const fd = openSync(absolute, 'r');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    try {
      let bytes;
      while ((bytes = readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, bytes));
    } finally {
      closeSync(fd);
    }
    const after = lstatSync(absolute);
    if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) fail(`Source changed while being fingerprinted: ${file}`);
  }
  return { fingerprint: hash.digest('hex'), head, base, baseTip };
}

function assertWholePrBoundary(root, taskManifest, unit) {
  if (git(['status', '--porcelain', '--untracked-files=all'], root)) {
    fail('A final whole-PR review needs a clean committed working tree');
  }
  const base = git(['merge-base', taskManifest.base, 'HEAD'], root);
  const changed = prChangedPaths(root, base);
  const uncovered = changed.filter(
    (path) => !unit.paths.some((assigned) => assigned === '.' || path === assigned || path.startsWith(`${assigned.replace(/\/$/, '')}/`)),
  );
  if (uncovered.length > 0) fail(`Whole-PR review scope omits: ${uncovered.join(', ')}`);
}

function reportFromFile(root, file) {
  const path = safePath(root, file.replaceAll('\\', '/'));
  if (lstatSync(path).isSymbolicLink()) fail('Report file cannot be a symbolic link');
  const report = readJson(path, 'Checkpoint report');
  if (typeof report.summary !== 'string' || !report.summary.trim()) fail('Report summary is required');
  for (const name of ['remainingPaths', 'evidence', 'findings', 'commands']) {
    if (!Array.isArray(report[name])) fail(`Report ${name} must be an array`);
  }
  if (report.evidence.length === 0) fail('Report needs at least one evidence reference');
  if (report.commands.length === 0 && !report.validationNotRunReason?.trim()) {
    fail('Report needs a validation command or a reason validation was not run');
  }
  for (const command of report.commands) {
    if (typeof command.command !== 'string' || !Number.isInteger(command.exitCode))
      fail('Report commands need command and integer exitCode');
  }
  for (const finding of report.findings) {
    if (typeof finding.summary !== 'string' || !['open', 'closed', 'accepted', 'deferred'].includes(finding.disposition)) {
      fail('Report findings need summary and a valid disposition');
    }
  }
  return report;
}

function latestReport(history) {
  return history.findLast((event) => event.report)?.report;
}

function completionState(root, taskManifest, unit, history) {
  const last = history.at(-1);
  const checkpoint = history.findLast((event) => event.report);
  const current = source(root, taskManifest, unit);
  const sourceCurrent = checkpoint?.source?.fingerprint === current.fingerprint;
  if (!last) return { status: 'pending', sourceCurrent: false, checkpoint: null };
  if (last.type === 'supersede') {
    return { status: 'superseded', sourceCurrent: false, checkpoint: latestReport(history) ?? null, supersededBy: last.by };
  }
  if (last.type === 'complete') {
    return { status: sourceCurrent ? 'complete' : 'stale', sourceCurrent, checkpoint: latestReport(history) };
  }
  return {
    status: last.type === 'start' ? 'running' : last.type === 'interrupt' ? 'interrupted' : 'in-progress',
    sourceCurrent,
    checkpoint: latestReport(history) ?? null,
  };
}

function taskState(root, task) {
  const taskManifest = manifest(root, task);
  const all = units(root, task);
  const summaries = new Map();
  for (const unit of all) summaries.set(unit.id, { ...unit, ...completionState(root, taskManifest, unit, events(root, task, unit.id)) });
  let changed;
  do {
    changed = false;
    for (const unit of all) {
      const state = summaries.get(unit.id);
      if (state.status === 'complete' && unit.dependsOn.some((dependency) => summaries.get(dependency)?.status !== 'complete')) {
        state.status = 'stale';
        changed = true;
      }
    }
  } while (changed);
  const readyUnits = all
    .filter((unit) => {
      const state = summaries.get(unit.id);
      return (
        ['pending', 'interrupted', 'stale', 'in-progress'].includes(state.status) &&
        unit.dependsOn.every((dependency) => summaries.get(dependency)?.status === 'complete')
      );
    })
    .map((unit) => unit.id);
  const baseline = remoteBaseline(root, task);
  const exportedPath = snapshotPath(root, task);
  const remoteCurrent =
    baseline !== null &&
    baseline.issue === taskManifest.issue &&
    existsSync(exportedPath) &&
    createHash('sha256').update(readFileSync(exportedPath)).digest('hex') === baseline.digest &&
    all.every((unit) => baseline.eventTails?.[unit.id] === (events(root, task, unit.id).at(-1)?.id ?? null));
  return {
    task: taskManifest.task,
    goal: taskManifest.goal,
    branch: git(['branch', '--show-current'], root),
    units: [...summaries.values()],
    readyUnits,
    remoteCurrent,
  };
}

function init(root, options) {
  if (!options.goal?.trim()) fail('--goal is required');
  const base = options.base ?? 'main';
  const branch = git(['branch', '--show-current'], root);
  if (!branch) fail('AIDD ledger needs a named branch');
  git(['rev-parse', '--verify', `${base}^{commit}`], root);
  const path = join(taskDirectory(root, options.task), 'manifest.json');
  if (existsSync(path)) {
    const existing = manifest(root, options.task);
    if (
      existing.goal !== options.goal ||
      existing.issue !== (options.issue ?? null) ||
      existing.base !== base ||
      existing.branch !== branch
    ) {
      fail('Task already exists with different goal, issue, or base');
    }
    return taskState(root, options.task);
  }
  atomicCreate(root, path, {
    version,
    task: options.task,
    root,
    branch,
    goal: options.goal,
    issue: options.issue ?? null,
    base,
    createdAt: new Date().toISOString(),
  });
  return taskState(root, options.task);
}

function add(root, options) {
  manifest(root, options.task);
  const id = identifier(options.unit, 'Unit ID');
  if (!kinds.has(options.kind)) fail(`Invalid unit kind: ${options.kind}`);
  if (!options.owner?.trim() || !options.acceptance?.trim()) fail('--owner and --acceptance are required');
  const paths = listOption(options.paths, '--paths').map((path) => {
    safePath(root, path);
    return path.replaceAll('\\', '/');
  });
  const dependsOn = options.depends ? listOption(options.depends, '--depends').map((entry) => identifier(entry, 'Dependency')) : [];
  if (dependsOn.includes(id)) fail('A unit cannot depend on itself');
  for (const dependency of dependsOn) readUnit(root, options.task, dependency);
  const value = { id, kind: options.kind, owner: options.owner, paths, dependsOn, acceptance: options.acceptance };
  const path = unitPath(root, options.task, id);
  if (existsSync(path)) {
    if (JSON.stringify(readUnit(root, options.task, id)) !== JSON.stringify(value)) fail(`Unit ${id} already exists with different scope`);
  } else {
    atomicCreate(root, path, value);
  }
  return taskState(root, options.task);
}

function hasOwnedImplementationDependency(root, task, unit) {
  const pending = [...unit.dependsOn];
  const visited = new Set();
  while (pending.length > 0) {
    const id = pending.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    const upstream = readUnit(root, task, id);
    if (upstream.kind === 'implementation' && upstream.owner === unit.owner) return true;
    pending.push(...upstream.dependsOn);
  }
  return false;
}

function act(root, command, options) {
  const taskManifest = manifest(root, options.task);
  const unit = readUnit(root, options.task, identifier(options.unit, 'Unit ID'));
  const state = taskState(root, options.task);
  const current = state.units.find((entry) => entry.id === unit.id);
  if (command === 'start') {
    if (!state.readyUnits.includes(unit.id)) fail(`Unit ${unit.id} is not ready to start`);
    append(root, options.task, unit.id, 'start', { owner: unit.owner });
  } else if (command === 'interrupt') {
    if (current.status !== 'running') fail(`Unit ${unit.id} is not running`);
    append(root, options.task, unit.id, 'interrupt', { reason: options.reason?.trim() || 'Agent or session interrupted' });
  } else if (command === 'supersede') {
    if (!['stale', 'interrupted', 'pending', 'in-progress'].includes(current.status))
      fail(`Unit ${unit.id} cannot be superseded from ${current.status}`);
    const successorId = identifier(options.by, 'Successor unit ID');
    if (successorId === unit.id) fail('A unit cannot supersede itself');
    if (state.units.find((entry) => entry.id === successorId)?.status !== 'complete')
      fail(`Successor unit ${successorId} must be complete and current`);
    if (!options.reason?.trim()) fail('--reason is required');
    append(root, options.task, unit.id, 'supersede', { by: successorId, reason: options.reason.trim() });
  } else {
    if (current.status !== 'running' && current.status !== 'in-progress') fail(`Unit ${unit.id} must be started before ${command}`);
    if (!options.report) fail('--report is required');
    const report = reportFromFile(root, options.report);
    if (command === 'complete') {
      if (report.remainingPaths.length > 0 || report.commands.some((entry) => entry.exitCode !== 0)) {
        fail('Cannot complete with remaining paths or failed commands');
      }
      if (report.findings.some((entry) => entry.disposition === 'open')) fail('Cannot complete with open findings');
      if (unit.kind === 'review' || unit.kind === 'review-closure') {
        const boundary = source(root, taskManifest, unit);
        const expectedScope = unit.kind === 'review' ? 'whole-pr' : 'finding-closure';
        if (
          report.review?.reviewedHead !== boundary.head ||
          report.review?.reviewedBase !== boundary.base ||
          report.review?.reviewedBaseTip !== boundary.baseTip ||
          report.review?.scope !== expectedScope ||
          report.review?.verdict !== 'pass' ||
          report.review?.reviewer !== unit.owner
        ) {
          fail('Review completion needs a passing scope and current base/head commits');
        }
        if (hasOwnedImplementationDependency(root, options.task, unit))
          fail('A reviewer cannot complete review of their own implementation unit');
        if (report.review.scope === 'whole-pr') assertWholePrBoundary(root, taskManifest, unit);
      }
    }
    append(root, options.task, unit.id, command, { report, source: source(root, taskManifest, unit) });
  }
  return taskState(root, options.task);
}

function recover(root, task) {
  manifest(root, task);
  const current = taskState(root, task);
  for (const unit of current.units.filter((entry) => entry.status === 'running')) {
    append(root, task, unit.id, 'interrupt', { reason: 'Recovered after interrupted coordinator or agent session' });
  }
  return taskState(root, task);
}

async function exportSnapshot(root, task) {
  const taskManifest = manifest(root, task);
  const state = taskState(root, task);
  if (state.units.some((unit) => unit.kind === 'review' && unit.status === 'complete')) {
    fail('Export the tracked snapshot before the final whole-PR review; exporting now would change its reviewed source');
  }
  const entries = units(root, task).map((unit) => {
    const history = events(root, task, unit.id);
    const checkpoint = history.findLast((event) => event.report);
    return {
      definition: unit,
      status: state.units.find((entry) => entry.id === unit.id).status,
      lastType: history.at(-1)?.type ?? null,
      ...(history.at(-1)?.type === 'supersede' ? { supersededBy: history.at(-1).by } : {}),
      checkpoint: checkpoint ? { report: checkpoint.report, source: checkpoint.source } : null,
    };
  });
  const path = snapshotPath(root, task);
  const candidate = {
    version,
    task,
    goal: taskManifest.goal,
    issue: taskManifest.issue,
    branch: taskManifest.branch,
    base: taskManifest.base,
    createdAt: taskManifest.createdAt,
    exportedAt: new Date().toISOString(),
    exportedHead: git(['rev-parse', 'HEAD'], root),
    units: entries,
  };
  if (existsSync(path)) {
    const baselinePath = exportStatePath(root, task);
    if (existsSync(baselinePath)) {
      const baseline = readJson(baselinePath, 'Local snapshot baseline');
      if (baseline.digest !== fileDigest(path)) fail('Tracked snapshot changed outside the ledger; reconcile it before exporting');
    } else {
      const relativePath = relative(root, path).replaceAll('\\', '/');
      if (git(['status', '--porcelain', '--', relativePath], root)) fail(`Tracked snapshot ${relativePath} has unrecorded local changes`);
    }
    const existing = readJson(path, 'Tracked AIDD snapshot');
    if (JSON.stringify({ ...existing, exportedAt: candidate.exportedAt }) === JSON.stringify(candidate)) {
      saveExportBaseline(root, task);
      return { snapshot: relative(root, path).replaceAll('\\', '/'), ...state };
    }
  } else if (existsSync(exportStatePath(root, task))) {
    fail('Tracked snapshot was removed after the last export; reconcile it before exporting');
  }
  let prettier;
  try {
    prettier = await import('prettier');
  } catch {
    fail('Prettier is required to export the tracked AIDD snapshot; run npm ci first');
  }
  const content = await prettier.format(JSON.stringify(candidate), {
    ...(await prettier.resolveConfig(path)),
    parser: 'json',
    filepath: path,
  });
  atomicReplace(root, path, content);
  saveExportBaseline(root, task);
  return { snapshot: relative(root, path).replaceAll('\\', '/'), ...state };
}

function importSnapshot(root, task) {
  const path = snapshotPath(root, task);
  safePath(root, relative(root, path).replaceAll('\\', '/'));
  const snapshot = readJson(path, 'Tracked AIDD snapshot');
  if (
    snapshot.version !== version ||
    snapshot.task !== task ||
    typeof snapshot.goal !== 'string' ||
    !snapshot.goal.trim() ||
    typeof snapshot.base !== 'string' ||
    snapshot.branch !== git(['branch', '--show-current'], root) ||
    !Array.isArray(snapshot.units)
  )
    fail('Tracked snapshot has an unsupported version, schema, or branch');
  git(['rev-parse', '--verify', `${snapshot.base}^{commit}`], root);
  const definitions = new Map();
  for (const entry of snapshot.units) {
    const unit = entry?.definition;
    identifier(unit?.id, 'Unit ID');
    if (
      definitions.has(unit.id) ||
      !kinds.has(unit.kind) ||
      !unit.owner?.trim() ||
      !unit.acceptance?.trim() ||
      !Array.isArray(unit.paths) ||
      unit.paths.length === 0 ||
      !Array.isArray(unit.dependsOn)
    ) {
      fail(`Invalid unit in tracked snapshot: ${unit.id}`);
    }
    for (const file of unit.paths) safePath(root, file);
    for (const dependency of unit.dependsOn) identifier(dependency, 'Dependency');
    if (entry.lastType !== null && !eventTypes.has(entry.lastType)) fail(`Invalid last event for ${unit.id}`);
    if (entry.checkpoint && (!entry.checkpoint.report || !/^[a-f0-9]{64}$/.test(entry.checkpoint.source?.fingerprint))) {
      fail(`Invalid checkpoint for ${unit.id}`);
    }
    if (entry.lastType === 'complete' && !entry.checkpoint) fail(`Completed unit ${unit.id} has no checkpoint`);
    if (entry.lastType === 'supersede') identifier(entry.supersededBy, 'Successor unit ID');
    definitions.set(unit.id, unit);
  }
  for (const unit of definitions.values()) {
    for (const dependency of unit.dependsOn) if (!definitions.has(dependency)) fail(`Missing dependency ${dependency}`);
  }
  for (const entry of snapshot.units) {
    if (entry.lastType === 'supersede' && (entry.supersededBy === entry.definition.id || !definitions.has(entry.supersededBy)))
      fail(`Invalid successor for ${entry.definition.id}`);
  }
  const visited = new Set();
  const visiting = new Set();
  function visit(id) {
    if (visiting.has(id)) fail(`Dependency cycle in tracked snapshot at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of definitions.get(id).dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of definitions.keys()) visit(id);
  const directory = taskDirectory(root, task);
  if (existsSync(directory)) fail(`Local ledger already exists for ${task}; inspect it before importing`);
  atomicCreate(root, join(directory, 'manifest.json'), {
    version,
    task,
    root,
    branch: snapshot.branch,
    goal: snapshot.goal,
    issue: snapshot.issue ?? null,
    base: snapshot.base,
    createdAt: snapshot.createdAt,
  });
  for (const unit of definitions.values()) atomicCreate(root, unitPath(root, task, unit.id), unit);
  for (const entry of snapshot.units) {
    const id = entry.definition.id;
    if (entry.checkpoint) append(root, task, id, 'checkpoint', entry.checkpoint);
    if (entry.lastType === 'complete') append(root, task, id, 'complete', entry.checkpoint);
    else if (entry.lastType === 'supersede')
      append(root, task, id, 'supersede', { by: entry.supersededBy, reason: 'Imported superseded unit' });
    else if (entry.lastType !== null) append(root, task, id, 'interrupt', { reason: 'Imported checkpoint; reverify before resuming' });
  }
  saveExportBaseline(root, task);
  return taskState(root, task);
}

function issueNumber(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) fail('A positive GitHub issue number is required for remote recovery');
  return value;
}

function commentMarker(task) {
  return `<!-- cthub-aidd-ledger:v1:${task} -->`;
}

function issueComments(root, repository, issue) {
  const pages = gh(root, ['api', '--paginate', '--slurp', `repos/${repository}/issues/${issue}/comments?per_page=100`]);
  if (!Array.isArray(pages) || pages.some((page) => !Array.isArray(page))) fail('GitHub returned invalid issue comments');
  return pages.flat();
}

function checkpointComment(root, repository, issue, task) {
  const marker = commentMarker(task);
  const matches = issueComments(root, repository, issue).filter((comment) => comment.body?.startsWith(marker));
  if (matches.length > 1) fail(`Multiple remote checkpoints match ${task}; reconcile them before continuing`);
  if (matches.length === 0) return null;
  const viewer = gh(root, ['api', 'user']);
  if (matches[0].user?.login?.toLowerCase() !== viewer.login?.toLowerCase()) {
    fail('The remote checkpoint belongs to another GitHub identity');
  }
  return matches[0];
}

function sourceCheckpointTip(root, task) {
  const ref = `refs/aidd/checkpoints/${task}`;
  const result = git(['ls-remote', 'origin', ref], root);
  if (!result) return null;
  const match = result.match(/^([a-f0-9]{40,64})\trefs\/aidd\/checkpoints\/[a-z0-9-]+$/);
  if (!match) fail('Remote source checkpoint ref is malformed');
  return match[1];
}

function remoteBody(task, snapshot, content, sourceCommit) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const digest = createHash('sha256').update(content).digest('hex');
  const summary = snapshot.units.map((entry) => `${entry.definition.id}: ${entry.status}`).join('; ');
  const sourceLine = sourceCommit ? `Source checkpoint: ${sourceCommit}\n` : '';
  const body = `${commentMarker(task)}\nAIDD recovery checkpoint for issue #${snapshot.issue}.\n\nBranch: ${snapshot.branch}\nHead: ${snapshot.exportedHead}\n${sourceLine}Units: ${summary}\n\n<!-- cthub-aidd-sha256:${digest} -->\n<!-- cthub-aidd-data:${encoded} -->`;
  if (Buffer.byteLength(body, 'utf8') > 60000)
    fail('Remote checkpoint exceeds the safe GitHub comment size; shorten reports before publishing');
  return { body, digest };
}

function snapshotFromComment(comment, task, issue) {
  const body = comment?.body ?? '';
  if (!body.startsWith(commentMarker(task))) fail('Remote checkpoint marker does not match the task');
  const digest = body.match(/<!-- cthub-aidd-sha256:([a-f0-9]{64}) -->/)?.[1];
  const encoded = body.match(/<!-- cthub-aidd-data:([A-Za-z0-9+/=]+) -->/)?.[1];
  if (!digest || !encoded || Buffer.from(encoded, 'base64').toString('base64') !== encoded) fail('Remote checkpoint payload is malformed');
  const content = Buffer.from(encoded, 'base64').toString('utf8');
  if (createHash('sha256').update(content).digest('hex') !== digest) fail('Remote checkpoint digest does not match its payload');
  let snapshot;
  try {
    snapshot = JSON.parse(content);
  } catch {
    fail('Remote checkpoint JSON is malformed');
  }
  if (snapshot.version !== version || snapshot.task !== task || String(snapshot.issue) !== issue) {
    fail('Remote checkpoint task, issue, or version does not match');
  }
  return { snapshot, content, digest };
}

function remoteBaseline(root, task) {
  const path = remoteStatePath(root, task);
  if (!existsSync(path)) return null;
  safePath(root, relative(root, path).replaceAll('\\', '/'));
  const state = readJson(path, 'Remote checkpoint baseline');
  if (!/^[a-f0-9]{64}$/.test(state.digest ?? '')) fail('Remote checkpoint baseline is malformed');
  return state;
}

function saveRemoteBaseline(root, task, repository, issue, digest) {
  const eventTails = Object.fromEntries(units(root, task).map((unit) => [unit.id, events(root, task, unit.id).at(-1)?.id ?? null]));
  atomicReplace(root, remoteStatePath(root, task), `${JSON.stringify({ repository, issue, digest, eventTails }, null, 2)}\n`);
}

async function publishSnapshot(root, task, mode) {
  if (!['preview', 'apply'].includes(mode)) fail('--mode must be preview or apply');
  const taskManifest = manifest(root, task);
  const issue = issueNumber(taskManifest.issue);
  const repository = privateRepository(root);
  const exported = await exportSnapshot(root, task);
  const path = snapshotPath(root, task);
  const snapshot = readJson(path, 'Tracked AIDD snapshot');
  const content = readFileSync(path);
  const sourceCommit = sourceCheckpointTip(root, task);
  if (sourceCommit) {
    const sourceSnapshot = git(['show', `${sourceCommit}:docs/status/aidd/${task}.json`], root, 'buffer');
    if (!content.equals(sourceSnapshot)) fail('Source checkpoint snapshot differs from process snapshot; publish source checkpoint first');
  }
  const { body, digest } = remoteBody(task, snapshot, content.toString('utf8'), sourceCommit);
  const existing = checkpointComment(root, repository, issue, task);
  const baseline = remoteBaseline(root, task);
  const remoteDigest = existing ? snapshotFromComment(existing, task, issue).digest : null;
  const safeToApply =
    existing === null ||
    existing.body === body ||
    (baseline?.repository === repository && baseline.issue === issue && baseline.digest === remoteDigest);
  if (mode === 'preview')
    return { ...exported, remote: { repository, issue, action: existing ? 'update' : 'create', digest, safeToApply, written: false } };
  if (!safeToApply) fail('Remote checkpoint changed or has no matching local baseline; restore or reconcile it before publishing');
  if (existing?.body === body) {
    saveRemoteBaseline(root, task, repository, issue, digest);
    return {
      snapshot: exported.snapshot,
      ...taskState(root, task),
      remote: { repository, issue, comment: existing.html_url, digest, written: false },
    };
  }
  const endpoint = existing ? `repos/${repository}/issues/comments/${existing.id}` : `repos/${repository}/issues/${issue}/comments`;
  const written = gh(root, ['api', '-X', existing ? 'PATCH' : 'POST', endpoint, '--input', '-'], JSON.stringify({ body }));
  if (!Number.isInteger(written.id)) fail('GitHub did not return a checkpoint comment ID');
  const verified = gh(root, ['api', `repos/${repository}/issues/comments/${written.id}`]);
  if (verified.body !== body) fail('Remote checkpoint write failed verification');
  saveRemoteBaseline(root, task, repository, issue, digest);
  return {
    snapshot: exported.snapshot,
    ...taskState(root, task),
    remote: { repository, issue, comment: verified.html_url, digest, written: true },
  };
}

function restoreRemote(root, task, issueValue) {
  const issue = issueNumber(issueValue);
  if (existsSync(taskDirectory(root, task))) fail(`Local ledger already exists for ${task}; inspect it before restoring`);
  const repository = privateRepository(root);
  const comment = checkpointComment(root, repository, issue, task);
  if (!comment) fail(`No remote checkpoint exists for ${task} on issue #${issue}`);
  const { snapshot, content, digest } = snapshotFromComment(comment, task, issue);
  if (snapshot.branch !== git(['branch', '--show-current'], root)) fail(`Remote checkpoint belongs to branch ${snapshot.branch}`);
  const path = snapshotPath(root, task);
  if (existsSync(path)) {
    const existing = readJson(path, 'Tracked AIDD snapshot');
    if (JSON.stringify(existing) !== JSON.stringify(snapshot)) {
      const relativePath = relative(root, path).replaceAll('\\', '/');
      if (git(['status', '--porcelain', '--', relativePath], root))
        fail(`Local snapshot ${relativePath} has changes; preserve them before restoring`);
    }
  }
  atomicReplace(root, path, content);
  importSnapshot(root, task);
  saveRemoteBaseline(root, task, repository, issue, digest);
  return { remote: { repository, issue, comment: comment.html_url }, ...taskState(root, task) };
}

export async function runLedger(argv, dependencies = {}) {
  if (injectedGh) fail('Another injected GitHub call is still active');
  injectedGh = dependencies.gh ?? null;
  try {
    const { command, options } = parse(argv);
    const root = repoRoot(dependencies.cwd);
    const result =
      command === 'init'
        ? init(root, options)
        : command === 'add'
          ? add(root, options)
          : command === 'export'
            ? await exportSnapshot(root, options.task)
            : command === 'publish'
              ? await publishSnapshot(root, options.task, options.mode ?? 'preview')
              : command === 'restore'
                ? restoreRemote(root, options.task, options.issue)
                : command === 'import'
                  ? importSnapshot(root, options.task)
                  : command === 'recover'
                    ? recover(root, options.task)
                    : command === 'status'
                      ? taskState(root, options.task)
                      : act(root, command, options);
    return result;
  } finally {
    injectedGh = null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await runLedger(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(`AIDD ledger: ${error.message}`);
    process.exitCode = 1;
  }
}
