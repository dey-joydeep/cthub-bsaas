import { createPrivateKey, createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const apps = Object.freeze({
  po: { slug: 'shearflow-po', appId: 5552057, installationId: 177123152, permissions: { issues: 'write', metadata: 'read' } },
  qa: {
    slug: 'shearflow-qa',
    appId: 5552133,
    installationId: 177125278,
    permissions: { checks: 'write', contents: 'read', metadata: 'read', pull_requests: 'write' },
  },
  dev: {
    slug: 'shearflow-dev',
    appId: 5563672,
    installationId: 177419051,
    permissions: { contents: 'write', issues: 'read', metadata: 'read', pull_requests: 'write', workflows: 'write' },
  },
});

const [role, keyPath] = process.argv.slice(2);
if (!apps[role] || !keyPath || process.argv.length !== 4) {
  console.error('Usage: node scripts/aidd/verify-github-app-installation.mjs <po|qa|dev> <private-key-file>');
  process.exit(2);
}

const expected = apps[role];
const relativeKeyPath = relative(process.cwd(), resolve(keyPath));
if (relativeKeyPath === '' || (!relativeKeyPath.startsWith('..') && !isAbsolute(relativeKeyPath))) {
  console.error('App private keys must be stored outside the repository.');
  process.exit(1);
}
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${encoded({ alg: 'RS256', typ: 'JWT' })}.${encoded({ iat: now - 60, exp: now + 540, iss: expected.appId })}`;

let jwt;
try {
  const key = createPrivateKey(readFileSync(keyPath));
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  jwt = `${unsigned}.${signer.sign(key).toString('base64url')}`;
} catch {
  console.error(`Cannot read or sign with the ${role} App private key.`);
  process.exit(1);
}

async function get(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
      'User-Agent': 'cthub-aidd-app-verifier',
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${path} returned HTTP ${response.status}`);
  return response.json();
}

try {
  const [app, installation, repositoryInstallation] = await Promise.all([
    get('/app'),
    get(`/app/installations/${expected.installationId}`),
    get('/repos/dey-joydeep/cthub-bsaas/installation'),
  ]);
  if (app.id !== expected.appId || app.slug !== expected.slug) throw new Error('App identity does not match the selected role');
  if (installation.id !== expected.installationId || repositoryInstallation.id !== expected.installationId) {
    throw new Error('Repository installation does not match the expected App installation');
  }
  if (installation.suspended_at) throw new Error('App installation is suspended');
  if (installation.repository_selection !== 'selected') throw new Error('App installation is not limited to selected repositories');
  const sortedPermissions = (permissions) =>
    JSON.stringify(Object.entries(permissions).sort(([left], [right]) => left.localeCompare(right)));
  if (sortedPermissions(installation.permissions ?? {}) !== sortedPermissions(expected.permissions)) {
    throw new Error('App permissions differ from the reviewed role contract');
  }
  console.log(
    `${role}: ${app.slug} identity and cthub-bsaas installation verified; permissions: ${JSON.stringify(installation.permissions ?? {})}`,
  );
} catch (error) {
  console.error(`${role}: verification failed: ${error.message}`);
  process.exitCode = 1;
}
