import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runDispatch, validateDispatch } from './bot-dispatch.mjs';

const base = { GH_TOKEN: 'test-token', AIDD_BOT_ROLE: 'po', AIDD_BOT_OPERATION: 'verify' };
const installation = { total_count: 1, repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }] };
const head = 'a'.repeat(40);
const reply = (value, status = 200) => ({ ok: status < 400, status, json: async () => value });

test('only role-owned operations and submitted QA review decisions are accepted', () => {
  assert.throws(() => validateDispatch({ ...base, AIDD_BOT_OPERATION: 'pr-review' }), /not allowed/);
  assert.throws(
    () =>
      validateDispatch({
        ...base,
        AIDD_BOT_ROLE: 'qa',
        AIDD_BOT_OPERATION: 'pr-review',
        AIDD_PR_NUMBER: '99',
        AIDD_BODY: 'Reviewed',
        AIDD_REVIEW_EVENT: 'APPROVE',
      }),
    /COMMENT or REQUEST_CHANGES/,
  );
  assert.throws(() => validateDispatch({ ...base, GH_TOKEN: '' }), /installation token/);
});

test('verification rejects a token with access to another repository', async () => {
  await assert.rejects(
    runDispatch(base, async () => reply({ total_count: 2, repositories: installation.repositories })),
    /not limited to the expected repository/,
  );
});

test('PO issue creation sends text as JSON to the fixed repository', async () => {
  const calls = [];
  const result = await runDispatch(
    { ...base, AIDD_BOT_OPERATION: 'issue-create', AIDD_TITLE: 'Plan work', AIDD_BODY: 'Acceptance criteria' },
    async (url, options) => {
      calls.push({ url, options });
      return reply(calls.length === 1 ? installation : { number: 101, html_url: 'https://github.com/dey-joydeep/cthub-bsaas/issues/101' });
    },
  );
  assert.equal(result.number, 101);
  assert.equal(calls[1].url, 'https://api.github.com/repos/dey-joydeep/cthub-bsaas/issues');
  assert.deepEqual(JSON.parse(calls[1].options.body), { title: 'Plan work', body: 'Acceptance criteria' });
  assert.equal(calls[1].options.redirect, 'error');
});

test('PO issue comment rejects a PR number before posting', async () => {
  const calls = [];
  await assert.rejects(
    runDispatch({ ...base, AIDD_BOT_OPERATION: 'issue-comment', AIDD_ISSUE_NUMBER: '99', AIDD_BODY: 'Comment' }, async (url) => {
      calls.push(url);
      return reply(calls.length === 1 ? installation : { state: 'open', pull_request: { url: 'https://api.github.com/pulls/99' } });
    }),
    /open issue, not a PR/,
  );
  assert.equal(calls.length, 2);
});

test('QA review is submitted only after repository verification', async () => {
  const calls = [];
  const result = await runDispatch(
    {
      ...base,
      AIDD_BOT_ROLE: 'qa',
      AIDD_BOT_OPERATION: 'pr-review',
      AIDD_PR_NUMBER: '99',
      AIDD_BODY: 'Regression failed',
      AIDD_REVIEW_EVENT: 'REQUEST_CHANGES',
      AIDD_EXPECTED_HEAD_SHA: head,
    },
    async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) return reply(installation);
      if (calls.length === 3) return reply({ id: 456, state: 'CHANGES_REQUESTED' });
      return reply({ state: 'open', head: { sha: head } });
    },
  );
  assert.equal(result.state, 'CHANGES_REQUESTED');
  assert.equal(calls[2].url, 'https://api.github.com/repos/dey-joydeep/cthub-bsaas/pulls/99/reviews');
  assert.deepEqual(JSON.parse(calls[2].options.body), {
    body: 'Regression failed',
    event: 'REQUEST_CHANGES',
    commit_id: head,
  });
});

test('QA review rejects a stale head before posting', async () => {
  const calls = [];
  await assert.rejects(
    runDispatch(
      {
        ...base,
        AIDD_BOT_ROLE: 'qa',
        AIDD_BOT_OPERATION: 'pr-review',
        AIDD_PR_NUMBER: '99',
        AIDD_BODY: 'Reviewed',
        AIDD_REVIEW_EVENT: 'COMMENT',
        AIDD_EXPECTED_HEAD_SHA: head,
      },
      async (url) => {
        calls.push(url);
        return reply(calls.length === 1 ? installation : { state: 'open', head: { sha: 'b'.repeat(40) } });
      },
    ),
    /head changed/,
  );
  assert.equal(calls.length, 2);
});

test('QA review reports a head change that races with submission', async () => {
  let calls = 0;
  await assert.rejects(
    runDispatch(
      {
        ...base,
        AIDD_BOT_ROLE: 'qa',
        AIDD_BOT_OPERATION: 'pr-review',
        AIDD_PR_NUMBER: '99',
        AIDD_BODY: 'Reviewed',
        AIDD_REVIEW_EVENT: 'COMMENT',
        AIDD_EXPECTED_HEAD_SHA: head,
      },
      async () => {
        calls += 1;
        if (calls === 1) return reply(installation);
        if (calls === 3) return reply({ id: 456, state: 'COMMENTED' });
        return reply({ state: 'open', head: { sha: calls === 2 ? head : 'b'.repeat(40) } });
      },
    ),
    /review is stale/,
  );
  assert.equal(calls, 4);
});

test('API failure reports status without returning body or token', async () => {
  await assert.rejects(
    runDispatch(base, async () => reply({ secret: 'test-token' }, 403)),
    (error) => error.message === 'GitHub API request failed with HTTP 403',
  );
});
