import assert from 'node:assert/strict';
import test from 'node:test';
import { assessBranchName, assessPrPolicy, assessReleaseTag } from './check-branch-policy.mjs';

test('accepts delivery and release branch names', () => {
  for (const branch of ['feature/salon-owner', 'fix/login-expiry', 'ci/use-osv', 'release/v1.2.3']) {
    assert.deepEqual(assessBranchName(branch), []);
  }
});

test('rejects invalid branch names and direct main work', () => {
  for (const branch of ['main', 'develop', 'feature/UpperCase', 'feature/has space', 'release/1.2.3', `fix/${'a'.repeat(51)}`]) {
    assert.notEqual(assessBranchName(branch).length, 0, branch);
  }
});

test('release tags must use the agreed version format', () => {
  assert.deepEqual(assessReleaseTag('v1.2.3'), []);
  assert.notEqual(assessReleaseTag('release-1.2.3').length, 0);
});

test('requires main target and a closing issue link on PRs', () => {
  assert.deepEqual(assessPrPolicy({ head: 'chore/aidd-flow', base: 'main', body: 'Closes #100' }), []);
  const errors = assessPrPolicy({ head: 'chore/aidd-flow', base: 'develop', body: 'Tracking issue: #100' });
  assert.equal(errors.length, 2);
});

test('permits scoped maintenance PRs into a release branch', () => {
  assert.deepEqual(assessPrPolicy({ head: 'fix/salon-booking', base: 'release/v1.2.3', body: 'Fixes #101' }), []);
  assert.match(assessPrPolicy({ head: 'feature/new-menu', base: 'release/v1.2.3', body: 'Closes #102' }).join('\n'), /maintenance/);
});
