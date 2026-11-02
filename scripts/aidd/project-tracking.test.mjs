import test from 'node:test';
import assert from 'node:assert/strict';
import { assessProjectTracking, trackingIssueNumbers } from './project-tracking.mjs';
import { parseOptions, proposedChanges, trackIssue } from './track-issue.mjs';

const repo = 'dey-joydeep/cthub-bsaas';
const issue = (number, status) => ({ content: { url: `https://github.com/${repo}/issues/${number}` }, status });
const fields = [
  {
    id: 'status-field-id',
    name: 'Status',
    options: [
      { id: 'review-option-id', name: 'In review' },
      { id: 'ready-option-id', name: 'Ready' },
    ],
  },
  { id: 'priority-field-id', name: 'Priority', options: [{ id: 'priority-option-id', name: 'P1' }] },
];

test('tracking issue extraction deduplicates same-repository closing references', () => {
  assert.deepEqual(trackingIssueNumbers('Closes #100. Fixes #100; Resolves #101.'), [100, 101]);
  assert.deepEqual(trackingIssueNumbers('Related to #100'), []);
});

test('merge readiness requires each linked issue on the correct Project with a review status', () => {
  assert.deepEqual(assessProjectTracking('Closes #100', [issue(100, 'In review')], repo), []);
  assert.match(assessProjectTracking('Closes #100', [], repo)[0], /not on GitHub Project/);
  assert.match(assessProjectTracking('Closes #100', [issue(100, '')], repo)[0], /no Project Status/);
  assert.match(assessProjectTracking('Closes #100', [issue(100, 'Ready')], repo)[0], /set Project Status/);
  assert.equal(assessProjectTracking('Closes #100 and #101', [issue(100, 'In review')], repo).length, 0);
  assert.equal(assessProjectTracking('Closes #100; Fixes #101', [issue(100, 'In review')], repo).length, 1);
});

test('standalone tracker rejects missing status and invalid board values before writing', () => {
  assert.throws(() => proposedChanges(null, fields, {}), /needs --status/);
  assert.throws(() => proposedChanges(null, fields, { status: 'Done' }), /does not exist/);
  assert.deepEqual(proposedChanges({ status: 'In review' }, fields, { status: 'In review' }), []);
  assert.deepEqual(proposedChanges({ status: 'Ready' }, fields, { status: 'In review', priority: 'P1' }), [
    { field: 'Status', from: 'Ready', to: 'In review' },
    { field: 'Priority', from: null, to: 'P1' },
  ]);
});

test('standalone tracker requires an existing issue and has an explicit write switch', () => {
  assert.deepEqual(parseOptions(['--repo', repo, '--issue', '100']), {
    owner: 'dey-joydeep',
    project: '1',
    apply: false,
    repo,
    issue: '100',
  });
  assert.equal(parseOptions(['--repo', repo, '--issue', '100', '--apply']).apply, true);
  assert.throws(() => parseOptions(['--repo', repo, '--issue', '0']), /positive issue number/);
});

test('standalone tracker previews without writing, then adds and verifies a Project item', () => {
  const calls = [];
  let added = false;
  let status = null;
  const client = (args) => {
    calls.push(args);
    if (args[0] === 'issue') return { number: 100, url: `https://github.com/${repo}/issues/100`, state: 'OPEN' };
    if (args[1] === 'view') return { id: 'project-id', url: 'https://github.com/users/dey-joydeep/projects/1' };
    if (args[1] === 'field-list') return { fields };
    if (args[1] === 'item-list') {
      return { totalCount: added ? 1 : 0, items: added ? [{ id: 'item-id', ...issue(100, status) }] : [] };
    }
    if (args[1] === 'item-add') {
      added = true;
      return { id: 'item-id' };
    }
    if (args[1] === 'item-edit') {
      assert.deepEqual(args, [
        'project',
        'item-edit',
        '--id',
        'item-id',
        '--project-id',
        'project-id',
        '--field-id',
        'status-field-id',
        '--single-select-option-id',
        'review-option-id',
        '--format',
        'json',
      ]);
      status = 'In review';
      return { id: 'item-id' };
    }
    throw new Error(`Unexpected gh call: ${args.join(' ')}`);
  };
  const options = parseOptions(['--repo', repo, '--issue', '100', '--status', 'In review']);
  assert.deepEqual(trackIssue(options, client).changes, [{ field: 'Status', from: null, to: 'In review' }]);
  assert.equal(
    calls.some((args) => ['item-add', 'item-edit'].includes(args[1])),
    false,
  );
  assert.equal(trackIssue({ ...options, apply: true }, client).applied, true);
  assert.equal(status, 'In review');
  const writes = calls.filter((args) => ['item-add', 'item-edit'].includes(args[1]));
  assert.equal(writes.length, 2);
  assert.deepEqual(trackIssue({ ...options, apply: true }, client).changes, []);
  assert.equal(calls.filter((args) => ['item-add', 'item-edit'].includes(args[1])).length, 2);
});

test('standalone tracker updates an existing item by IDs and rejects missing IDs before a write', () => {
  const calls = [];
  let status = 'Ready';
  const client = (args) => {
    calls.push(args);
    if (args[0] === 'issue') return { number: 100, url: `https://github.com/${repo}/issues/100`, state: 'OPEN' };
    if (args[1] === 'view') return { id: 'project-id', url: 'https://github.com/users/dey-joydeep/projects/1' };
    if (args[1] === 'field-list') return { fields };
    if (args[1] === 'item-list') return { totalCount: 1, items: [{ id: 'existing-id', ...issue(100, status) }] };
    if (args[1] === 'item-edit') {
      assert.deepEqual(args, [
        'project',
        'item-edit',
        '--id',
        'existing-id',
        '--project-id',
        'project-id',
        '--field-id',
        'status-field-id',
        '--single-select-option-id',
        'review-option-id',
        '--format',
        'json',
      ]);
      status = 'In review';
      return { id: 'existing-id' };
    }
    throw new Error(`Unexpected gh call: ${args.join(' ')}`);
  };
  const options = parseOptions(['--repo', repo, '--issue', '100', '--status', 'In review', '--apply']);
  assert.equal(trackIssue(options, client).add, false);
  assert.equal(calls.filter((args) => args[1] === 'item-edit').length, 1);
  assert.equal(calls.filter((args) => args[1] === 'item-add').length, 0);

  calls.length = 0;
  assert.throws(
    () =>
      trackIssue(options, (args) => {
        calls.push(args);
        if (args[0] === 'issue') return { number: 100, url: `https://github.com/${repo}/issues/100`, state: 'OPEN' };
        if (args[1] === 'view') return { id: 'project-id', url: 'https://github.com/users/dey-joydeep/projects/1' };
        if (args[1] === 'field-list') return { fields: [{ name: 'Status', options: [{ name: 'In review' }] }] };
        if (args[1] === 'item-list') return { totalCount: 0, items: [] };
        throw new Error(`Unexpected write: ${args.join(' ')}`);
      }),
    /field or option ID is unavailable/,
  );
  assert.equal(
    calls.some((args) => ['item-add', 'item-edit'].includes(args[1])),
    false,
  );
});
