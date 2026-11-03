import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const roles = ['customer', 'partner', 'admin'];

export function portsForSlot(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 19) {
    throw new Error('Worktree slot must be an integer from 0 to 19.');
  }

  const offset = slot * 10;
  return {
    api: 3000 + offset,
    ssr: 4000 + offset,
    customer: 4200 + offset,
    partner: 4201 + offset,
    admin: 4202 + offset,
  };
}

export function prepareWorktreeRuntime(root, slot) {
  const ports = portsForSlot(slot);
  const targets = roles.map((role) => join(root, 'libs', 'web', 'config', 'src', 'environments', role, 'environment.worktree.ts'));
  if (!existsSync(join(root, 'package.json')) || targets.some((target) => !existsSync(join(dirname(target), 'environment.ts')))) {
    throw new Error('Run this command from the repository root with the three web environment directories present.');
  }

  const source = `// Generated local worktree configuration. Do not commit.\nexport const environment = {\n  production: false,\n  apiUrl: '/api',\n  version: '1.0.0',\n};\n`;
  for (const target of targets) {
    writeFileSync(target, source, { encoding: 'utf8', mode: 0o600 });
  }
  const proxyDirectory = join(root, 'tmp', 'aidd-runtime');
  mkdirSync(proxyDirectory, { recursive: true });
  const proxy = {
    '/api': { target: `http://localhost:${ports.api}`, secure: false },
    '/partner': { target: `http://localhost:${ports.api}`, secure: false },
  };
  writeFileSync(join(proxyDirectory, 'proxy.conf.json'), `${JSON.stringify(proxy, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return ports;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--slot') {
    throw new Error('Usage: node scripts/aidd/prepare-worktree-runtime.mjs --slot <0-19>');
  }
  const slot = Number(args[1]);
  const ports = prepareWorktreeRuntime(process.cwd(), slot);
  const origins = roles.map((role) => `http://localhost:${ports[role]}`).join(',');

  console.log(
    `Worktree slot ${slot}: API ${ports.api}, customer ${ports.customer}, partner ${ports.partner}, admin ${ports.admin}, standalone SSR ${ports.ssr}.`,
  );
  console.log('Open a separate terminal at this worktree root for each server:');
  console.log(`  Web SSR: set AIDD_WORKTREE_API_ORIGIN=http://localhost:${ports.api} in each web terminal before serving.`);
  console.log(
    `  API: Set PORT=${ports.api}, CORS_ORIGINS=${origins}, FRONTEND_URLS=${origins}, FRONTEND_URL=http://localhost:${ports.customer}, and a separate local DATABASE_URL; then run npm exec nx -- serve api`,
  );
  for (const role of roles) {
    console.log(`  ${role}: npm exec nx -- serve web-app-${role} --configuration=worktree --port=${ports[role]}`);
  }
  console.log('Relative /api and /partner requests use the generated local dev-server proxy.');
  console.log(
    'Use a separate browser profile for each concurrently running worktree stack; localhost cookies are shared across ports within one profile.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
