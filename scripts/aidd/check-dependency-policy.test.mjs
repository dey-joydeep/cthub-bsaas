import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectDependencyState } from './check-dependency-policy.mjs';

const manifests = {
  '': { workspaces: ['apps/api'], dependencies: { alpha: '1.0.0' }, scripts: { 'deps:audit': 'npm audit' } },
  'apps/api': { peerDependencies: { zeta: '^2', beta: '^1' } },
};
const lock = {
  packages: {
    '': { dependencies: { alpha: '1.0.0' } },
    'apps/api': { peerDependencies: { beta: '^1', zeta: '^2' } },
  },
};

test('accepts matching workspace manifests regardless of dependency key order', () => {
  assert.deepEqual(inspectDependencyState(manifests, lock), []);
});

test('rejects missing or mismatched lockfile entries', () => {
  assert.match(inspectDependencyState(manifests, { packages: { '': {} } }).join('\n'), /dependencies differs|Missing manifest/);
});

test('rejects external tarballs and unknown local links in the lockfile', () => {
  const unsafeLock = {
    packages: {
      ...lock.packages,
      external: { resolved: 'https://example.invalid/a.tgz', integrity: 'sha512-AAAA' },
      local: { link: true, resolved: '../outside' },
    },
  };
  const errors = inspectDependencyState(manifests, unsafeLock);
  assert.equal(errors.length, 2);
});

test('rejects bypass settings in project npm config', () => {
  const errors = inspectDependencyState(
    manifests,
    lock,
    'legacy-peer-deps=true\npackage-lock=false\nforce=true\nsave=false\nstrict-ssl=false',
  );
  assert.equal(errors.length, 5);
});

test('rejects alternate boolean spellings for persistent bypass settings', () => {
  const errors = inspectDependencyState(manifests, lock, 'force=1\nlegacy-peer-deps=yes\nengine-strict=no\naudit=0');
  assert.equal(errors.length, 4);
});

test('checks workspace npm config and workspace scripts', () => {
  const unsafe = {
    ...manifests,
    'apps/api': { ...manifests['apps/api'], scripts: { update: 'npm install beta --force' } },
  };
  const errors = inspectDependencyState(unsafe, lock, { 'apps/api/.npmrc': 'legacy-peer-deps=true' });
  assert.equal(errors.length, 2);
});

test('rejects registry changes and alternate force spellings', () => {
  const unsafe = {
    ...manifests,
    '': { ...manifests[''], scripts: { install: 'npm --force install beta', fix: 'npm audit fix --force=true' } },
  };
  const errors = inspectDependencyState(unsafe, lock, 'registry=https://example.invalid/\n@private:registry=https://example.invalid/');
  assert.equal(errors.length, 4);
});

test('permits a read-only audit install and rejects unsafe dependency scripts', () => {
  const inspection = { ...manifests, '': { ...manifests[''], scripts: { inspection: 'npm ci --ignore-scripts --no-audit' } } };
  assert.deepEqual(inspectDependencyState(inspection, lock), []);
  const unsafe = { ...manifests, '': { ...manifests[''], scripts: { update: 'npm audit fix --force' } } };
  assert.match(inspectDependencyState(unsafe, lock).join('\n'), /forbidden dependency bypass/);
});
