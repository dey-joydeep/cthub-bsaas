import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

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

if (!existsSync(join(root, 'node_modules'))) {
  const installArgs = existsSync(join(root, 'package-lock.json')) ? ['ci'] : ['install'];
  const install = run(npmCommand, installArgs);
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
} else {
  log('node_modules already present, skipping install.');
}

log('Environment bootstrap completed.');
