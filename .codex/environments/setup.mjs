import { existsSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');

function npmInvocation() {
  if (process.platform !== 'win32') return { command: 'npm', prefix: [] };
  const directories = [dirname(process.execPath), ...(process.env.PATH ?? '').split(delimiter).filter(isAbsolute)];
  const cli = directories.map((directory) => join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js')).find(existsSync);
  if (!cli) {
    console.error('[codex-setup] npm CLI was not found beside Node or in an absolute PATH directory.');
    process.exit(1);
  }
  return { command: process.execPath, prefix: [cli] };
}

function log(message) {
  console.log(`[codex-setup] ${message}`);
}

function run(command, args) {
  log(`Running: ${command} ${args.join(' ')}`);
  if (dryRun) {
    return { status: 0 };
  }

  return spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
}

if (!existsSync(join(root, 'package.json'))) {
  console.error('[codex-setup] package.json not found. Run this setup from the repository root.');
  process.exit(1);
}

log(`Repository root: ${root}`);
log(`Node version: ${process.version}`);

if (!existsSync(join(root, 'package-lock.json'))) {
  console.error('[codex-setup] package-lock.json not found. Refusing an unreviewed install.');
  process.exit(1);
}

if (!existsSync(join(root, 'node_modules'))) {
  const npm = npmInvocation();
  const install = run(npm.command, [...npm.prefix, 'ci', '--ignore-scripts', '--no-audit', '--fund=false']);
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
} else {
  log('node_modules already present, skipping install.');
}

const versionCheck = run(process.execPath, ['scripts/check-versions/node-version.js']);
if (versionCheck.status !== 0) process.exit(versionCheck.status ?? 1);

const hooks = run(process.execPath, ['.husky/install.mjs']);
if (hooks.status !== 0) process.exit(hooks.status ?? 1);

const smoke = run(process.execPath, ['scripts/aidd/smoke-installed-toolchain.mjs']);
if (smoke.status !== 0) process.exit(smoke.status ?? 1);

log('Environment bootstrap completed.');
