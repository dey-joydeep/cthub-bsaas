#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const groups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const enabled = (value) => ['true', '1', 'yes'].includes(value);
const disabled = (value) => ['false', '0', 'no'].includes(value);
const forbiddenConfig = new Map([
  ['legacy-peer-deps', enabled],
  ['force', enabled],
  ['package-lock', disabled],
  ['save', disabled],
  ['strict-ssl', disabled],
  ['engine-strict', disabled],
  ['audit', disabled],
]);

function entries(value) {
  return Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right));
}

export function inspectDependencyState(manifests, lock, npmrc = '') {
  const errors = [];
  const root = manifests[''];
  if (!root || !lock?.packages) return ['Root manifest or npm lockfile is missing'];
  const expected = ['', ...(root.workspaces ?? [])];
  for (const workspace of expected) {
    const manifest = manifests[workspace];
    const locked = lock.packages[workspace];
    if (!manifest || !locked) {
      errors.push(`Missing manifest or lockfile workspace: ${workspace || '(root)'}`);
      continue;
    }
    for (const group of groups) {
      if (JSON.stringify(entries(manifest[group])) !== JSON.stringify(entries(locked[group]))) {
        errors.push(`${workspace || '(root)'}: ${group} differs from package-lock.json`);
      }
    }
  }
  const workspacePaths = new Set(root.workspaces ?? []);
  for (const [path, item] of Object.entries(lock.packages)) {
    if (!item.resolved) continue;
    if (item.link) {
      if (!workspacePaths.has(item.resolved)) errors.push(`${path}: lockfile link points outside declared workspaces`);
      continue;
    }
    try {
      const url = new URL(item.resolved);
      if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.port || url.username || url.password) {
        errors.push(`${path}: lockfile source is outside the approved npm registry`);
      }
    } catch {
      errors.push(`${path}: lockfile source is not an approved registry URL`);
    }
    if (!/^sha512-[A-Za-z0-9+/=]+$/.test(item.integrity ?? '')) {
      errors.push(`${path}: lockfile registry package lacks a SHA-512 integrity hash`);
    }
  }
  const configs = typeof npmrc === 'string' ? { '.npmrc': npmrc } : npmrc;
  for (const [file, content] of Object.entries(configs)) {
    for (const line of content.split(/\r?\n/)) {
      if (/^\s*@[^\s:]+:registry\s*=/i.test(line)) errors.push(`${file}: scoped registry override requires a reviewed policy change`);
      const match = line.match(/^\s*([a-z][a-z-]*)\s*=\s*([^#;\s]+)\s*(?:[#;].*)?$/i);
      if (!match) continue;
      const key = match[1].toLowerCase();
      const value = match[2].toLowerCase();
      if (forbiddenConfig.get(key)?.(value)) errors.push(`${file}: forbidden ${key}=${value}`);
      if (key === 'registry' && value !== 'https://registry.npmjs.org/') {
        errors.push(`${file}: registry override requires a reviewed policy change`);
      }
    }
  }
  for (const [workspace, manifest] of Object.entries(manifests)) {
    for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
      const mutatesDependencies = /\bnpm\b[^\n]*\b(?:install|i|add|update|uninstall|remove|rm)\b|\bnpm\b[^\n]*\baudit\s+fix\b/i.test(
        command,
      );
      const bypass =
        /(?:^|\s)(?:--legacy-peer-deps(?:=(?:true|1|yes))?|--force(?:=(?:true|1|yes))?|-f|--no-package-lock|--package-lock=false|--no-save|--save=false|--no-strict-ssl|--registry(?:=\S+)?)(?=\s|$)/i.test(
          command,
        );
      if (mutatesDependencies && bypass) {
        errors.push(`${workspace || '(root)'} package.json script ${name} uses a forbidden dependency bypass option`);
      }
    }
  }
  return errors;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

export function checkDependencyPolicy(root = process.cwd(), staged = false) {
  const read = (path) => {
    if (!staged) return existsSync(resolve(root, path)) ? readFileSync(resolve(root, path), 'utf8') : null;
    try {
      return execFileSync('git', ['show', `:${path}`], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return null;
    }
  };
  const rootText = read('package.json');
  if (!rootText) return ['Root package.json is absent from the selected source'];
  const manifest = JSON.parse(rootText);
  const manifests = { '': manifest };
  for (const workspace of manifest.workspaces ?? []) {
    const path = `${workspace}/package.json`;
    const content = read(path);
    if (content) manifests[workspace] = JSON.parse(content);
  }
  const lockText = read('package-lock.json');
  if (!lockText) return ['package-lock.json is absent from the selected source'];
  const lock = JSON.parse(lockText);
  const npmrc = {};
  for (const workspace of ['', ...(manifest.workspaces ?? [])]) {
    const path = `${workspace ? `${workspace}/` : ''}.npmrc`;
    const content = read(path);
    if (content) npmrc[path] = content;
  }
  return inspectDependencyState(manifests, lock, npmrc);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3 || (process.argv.length === 3 && process.argv[2] !== '--staged')) {
      throw new Error('Usage: npm run deps:policy -- [--staged]');
    }
    const root = git(['rev-parse', '--show-toplevel']);
    const errors = checkDependencyPolicy(root, process.argv[2] === '--staged');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Dependency manifests, lockfile, and repository npm config satisfy policy.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
