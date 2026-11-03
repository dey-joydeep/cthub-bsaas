import assert from 'node:assert/strict';
import test from 'node:test';
import { assessDependencyChange, changedDirectDependencies, newInstallScripts } from './check-dependency-change.mjs';

test('identifies direct additions, removals, and version changes in workspaces', () => {
  const before = {
    '': { workspaces: ['apps/api'], dependencies: { alpha: '^1', removed: '^1' } },
    'apps/api': { devDependencies: { beta: '^1' } },
  };
  const after = {
    '': { workspaces: ['apps/api'], dependencies: { alpha: '^2' } },
    'apps/api': { devDependencies: { beta: '^1', added: '^1' } },
  };
  assert.deepEqual(changedDirectDependencies(before, after), ['added', 'alpha', 'removed']);
});

test('finds newly introduced and upgraded packages with install scripts', () => {
  const before = { packages: { 'old-package': { hasInstallScript: true, version: '1' } } };
  const after = {
    packages: { 'old-package': { hasInstallScript: true, version: '2' }, 'new-package': { hasInstallScript: true, version: '1' } },
  };
  assert.deepEqual(newInstallScripts(before, after), ['new-package', 'old-package']);
});

test('requires owner, each dependency reason, and install-script inspection', () => {
  const errors = assessDependencyChange(
    ['@scope/pkg'],
    ['native-package'],
    'Dependency owner: TBD\n- @scope/pkg: no\nInstall scripts reviewed: none',
  );
  assert.equal(errors.length, 3);
  assert.deepEqual(
    assessDependencyChange(
      ['@scope/pkg'],
      ['native-package'],
      'Dependency owner: @maintainer\n- @scope/pkg: Needed for auth token parsing\nInstall scripts reviewed: native-package',
    ),
    [],
  );
});
