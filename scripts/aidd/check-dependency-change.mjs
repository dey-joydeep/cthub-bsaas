#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const groups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function gitShow(ref, path) {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function manifestAt(ref, workspace) {
  const text = gitShow(ref, `${workspace ? `${workspace}/` : ''}package.json`);
  return text ? JSON.parse(text) : null;
}

export function changedDirectDependencies(before, after) {
  const changes = new Set();
  const workspaces = new Set(['', ...(before['']?.workspaces ?? []), ...(after['']?.workspaces ?? [])]);
  for (const workspace of workspaces) {
    for (const group of groups) {
      const left = before[workspace]?.[group] ?? {};
      const right = after[workspace]?.[group] ?? {};
      for (const name of new Set([...Object.keys(left), ...Object.keys(right)])) {
        if (left[name] !== right[name]) changes.add(name);
      }
    }
  }
  return [...changes].sort();
}

export function newInstallScripts(before, after) {
  return Object.entries(after?.packages ?? {})
    .filter(
      ([path, item]) =>
        path &&
        item.hasInstallScript &&
        (!before?.packages?.[path] || !before.packages[path].hasInstallScript || before.packages[path].version !== item.version),
    )
    .map(([path]) => path)
    .sort();
}

export function assessDependencyChange(changes, installScripts, body) {
  const errors = [];
  if (changes.length) {
    const owner = body?.match(/^Dependency owner:\s*(\S.+)$/im)?.[1]?.trim();
    if (!owner || /^(none|n\/a|tbd)$/i.test(owner)) errors.push('PR needs a named Dependency owner');
    for (const name of changes) {
      const escape = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reason = body?.match(new RegExp(`^\\s*-\\s*${escape}:\\s*(.+)$`, 'im'))?.[1]?.trim();
      if (!reason || reason.length < 8 || /^(none|n\/a|tbd)$/i.test(reason)) {
        errors.push(`PR needs a specific dependency reason for ${name} as '- ${name}: reason'`);
      }
    }
  }
  if (installScripts.length) {
    const reviewed = body?.match(/^Install scripts reviewed:\s*(.+)$/im)?.[1] ?? '';
    for (const path of installScripts) {
      if (!reviewed.split(/\s*,\s*/).includes(path)) {
        errors.push(`PR must name new install script ${path} in 'Install scripts reviewed:' after inspection`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [base, head, eventPath] = process.argv.slice(2);
    if (!base || !head || process.argv.length > 5) {
      throw new Error('Usage: npm run deps:change -- <base-ref> <head-ref> [GitHub-event-json]');
    }
    const beforeRoot = manifestAt(base, '');
    const afterRoot = manifestAt(head, '');
    if (!beforeRoot || !afterRoot) throw new Error('Cannot read root dependency manifests at both refs');
    const workspaces = new Set(['', ...(beforeRoot.workspaces ?? []), ...(afterRoot.workspaces ?? [])]);
    const before = {};
    const after = {};
    for (const workspace of workspaces) {
      before[workspace] = manifestAt(base, workspace);
      after[workspace] = manifestAt(head, workspace);
    }
    const beforeLockText = gitShow(base, 'package-lock.json');
    const afterLockText = gitShow(head, 'package-lock.json');
    if (!beforeLockText || !afterLockText) throw new Error('Cannot read dependency lockfile at both refs');
    const beforeLock = JSON.parse(beforeLockText);
    const afterLock = JSON.parse(afterLockText);
    const changes = changedDirectDependencies(before, after);
    const scripts = newInstallScripts(beforeLock, afterLock);
    const event = eventPath ? JSON.parse(readFileSync(eventPath, 'utf8')) : null;
    if (eventPath && !event?.pull_request) throw new Error('GitHub event does not contain a pull request');
    const errors = event ? assessDependencyChange(changes, scripts, event.pull_request.body ?? '') : [];
    console.log(JSON.stringify({ directDependencies: changes, newInstallScripts: scripts, errors }, null, 2));
    if (errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
