import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPrAutomationEvidence } from './check-pr-automation-evidence.mjs';

const head = 'a'.repeat(40);
const base = 'b'.repeat(40);
const pr = {
  state: 'OPEN',
  isDraft: false,
  headRefOid: head,
  baseRefOid: base,
  baseRefName: 'main',
  statusCheckRollup: [{ __typename: 'CheckRun', workflowName: 'CI/CD', name: 'Main Workflow', status: 'COMPLETED', conclusion: 'SUCCESS' }],
};
const comment = {
  user: { login: 'chatgpt-codex-connector[bot]' },
  updated_at: '2026-10-28T00:00:00Z',
  body: `<!-- codex-review-state:v1 {"code_review":{"commit_sha":"${head}","has_unresolved_findings":false,"status":"completed"}} -->`,
};

test('current green PR with resolved review passes the automation evidence check', () => {
  assert.deepEqual(assessPrAutomationEvidence(pr, [comment], [{ isResolved: true }]), []);
});

test('a newer successful workflow run supersedes an older failure on the same head', () => {
  const failed = { ...pr.statusCheckRollup[0], startedAt: '2026-11-05T10:40:32Z', conclusion: 'FAILURE' };
  const passed = { ...pr.statusCheckRollup[0], startedAt: '2026-11-05T10:41:23Z' };
  assert.deepEqual(assessPrAutomationEvidence({ ...pr, statusCheckRollup: [failed, passed] }, [comment], []), []);
  assert.deepEqual(assessPrAutomationEvidence({ ...pr, statusCheckRollup: [passed, failed] }, [comment], []), []);
  const pending = { ...passed, startedAt: '2026-11-05T10:42:00Z', status: 'IN_PROGRESS', conclusion: null };
  assert.ok(
    assessPrAutomationEvidence({ ...pr, statusCheckRollup: [failed, passed, pending] }, [comment], []).some((error) =>
      /CI check Main Workflow/.test(error),
    ),
  );
});

test('a later head commit invalidates a previous review', () => {
  assert.match(assessPrAutomationEvidence({ ...pr, headRefOid: 'c'.repeat(40) }, [comment], [])[0], /stale/);
});

test('a stacked PR must target main after its dependency merges', () => {
  const errors = assessPrAutomationEvidence({ ...pr, baseRefName: 'feature/parent' }, [comment], [], 'main');
  assert.match(errors[0], /retarget to main/);
});

test('a release maintenance PR can target a versioned release branch', () => {
  assert.deepEqual(assessPrAutomationEvidence({ ...pr, baseRefName: 'release/v1.2.3' }, [comment], [], 'main'), []);
});

test('failed checks and unresolved threads fail closed', () => {
  const errors = assessPrAutomationEvidence(
    { ...pr, statusCheckRollup: [{ name: 'Main Workflow', status: 'COMPLETED', conclusion: 'FAILURE' }] },
    [comment],
    [{ isResolved: false }],
  );
  assert.equal(errors.length, 3);
  assert.ok(errors.some((error) => /Required Main Workflow/.test(error)));
  assert.ok(errors.some((error) => /CI check Main Workflow/.test(error)));
  assert.ok(errors.some((error) => /review thread/.test(error)));
});

test('an incidental green status cannot replace the required CI workflow', () => {
  const errors = assessPrAutomationEvidence(
    { ...pr, statusCheckRollup: [{ name: 'external', status: 'COMPLETED', conclusion: 'SUCCESS' }] },
    [comment],
    [],
  );
  assert.match(errors[0], /Required Main Workflow/);
});

test('a different workflow cannot impersonate the required check name', () => {
  const errors = assessPrAutomationEvidence(
    { ...pr, statusCheckRollup: [{ ...pr.statusCheckRollup[0], workflowName: 'Other Workflow' }] },
    [comment],
    [],
  );
  assert.match(errors[0], /Required Main Workflow/);
});

test('successful commit status contexts are accepted and pending ones are rejected', () => {
  const status = { __typename: 'StatusContext', context: 'external', state: 'SUCCESS' };
  assert.deepEqual(assessPrAutomationEvidence({ ...pr, statusCheckRollup: [...pr.statusCheckRollup, status] }, [comment], []), []);
  assert.match(
    assessPrAutomationEvidence({ ...pr, statusCheckRollup: [...pr.statusCheckRollup, { ...status, state: 'PENDING' }] }, [comment], [])[0],
    /CI check external is PENDING/,
  );
});

test('only the intentionally optional Windows smoke check may be skipped', () => {
  const skipped = {
    __typename: 'CheckRun',
    workflowName: 'CI/CD',
    name: 'Windows toolchain smoke',
    status: 'COMPLETED',
    conclusion: 'SKIPPED',
  };
  const checks = { ...pr, statusCheckRollup: [...pr.statusCheckRollup, skipped] };
  assert.deepEqual(assessPrAutomationEvidence(checks, [comment], [], 'main', []), []);
  assert.ok(assessPrAutomationEvidence(checks, [comment], [], 'main', ['package.json']).some((error) => /Windows toolchain/.test(error)));
  assert.ok(
    assessPrAutomationEvidence(checks, [comment], [], 'main', ['.github/workflows/ci.yml']).some((error) =>
      /Windows toolchain/.test(error),
    ),
  );
  assert.ok(assessPrAutomationEvidence(checks, [comment], []).some((error) => /Windows toolchain/.test(error)));
  assert.ok(
    assessPrAutomationEvidence(pr, [comment], [], 'main', ['package-lock.json']).some((error) => /Required Windows toolchain/.test(error)),
  );
  const requiredSkip = { ...skipped, name: 'Main Workflow' };
  assert.ok(
    assessPrAutomationEvidence({ ...pr, statusCheckRollup: [requiredSkip] }, [comment], []).some((error) =>
      /Required Main Workflow/.test(error),
    ),
  );
  const otherSkip = { ...skipped, name: 'Frontend Quality' };
  assert.ok(
    assessPrAutomationEvidence({ ...pr, statusCheckRollup: [...pr.statusCheckRollup, otherSkip] }, [comment], []).some((error) =>
      /Frontend Quality/.test(error),
    ),
  );
});

test('a usage-limit message or user-authored marker is not review evidence', () => {
  assert.match(assessPrAutomationEvidence(pr, [{ ...comment, body: 'You have reached your Codex usage limits' }], [])[0], /No Codex/);
  assert.match(assessPrAutomationEvidence(pr, [{ ...comment, user: { login: 'author' } }], [])[0], /No Codex/);
});
