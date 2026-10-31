#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repository = 'dey-joydeep/cthub-bsaas';
const apiBase = `https://api.github.com/repos/${repository}`;

export function validateDispatch(input) {
  const role = input.AIDD_BOT_ROLE;
  const operation = input.AIDD_BOT_OPERATION;
  const allowed = {
    po: new Set(['verify', 'issue-create', 'issue-comment']),
    qa: new Set(['verify', 'pr-review']),
  };
  if (!allowed[role]?.has(operation)) throw new Error('Operation is not allowed for this bot role');
  if (!input.GH_TOKEN) throw new Error('A GitHub App installation token is required');

  const number = operation === 'issue-comment' ? input.AIDD_ISSUE_NUMBER : input.AIDD_PR_NUMBER;
  if (operation === 'issue-comment' || operation === 'pr-review') {
    if (!/^[1-9]\d*$/.test(number ?? '')) throw new Error('A positive issue or PR number is required');
  }
  if (operation === 'issue-create') {
    if (!input.AIDD_TITLE?.trim() || input.AIDD_TITLE.length > 256) throw new Error('Issue title must be 1-256 characters');
  }
  if (operation !== 'verify' && !input.AIDD_BODY?.trim()) throw new Error('A non-empty body is required');
  if (operation === 'pr-review' && !['COMMENT', 'REQUEST_CHANGES'].includes(input.AIDD_REVIEW_EVENT)) {
    throw new Error('QA review event must be COMMENT or REQUEST_CHANGES');
  }
  if (operation === 'pr-review' && !/^[0-9a-f]{40}$/i.test(input.AIDD_EXPECTED_HEAD_SHA ?? '')) {
    throw new Error('QA review requires the exact 40-character PR head SHA');
  }
  return { role, operation, number };
}

export async function runDispatch(input, fetchImpl = fetch) {
  const { role, operation, number } = validateDispatch(input);
  const request = async (url, method = 'GET', body) => {
    const response = await fetchImpl(url, {
      method,
      redirect: 'error',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${input.GH_TOKEN}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`GitHub API request failed with HTTP ${response.status}`);
    return response.json();
  };

  const installation = await request('https://api.github.com/installation/repositories');
  const names = installation.repositories?.map((entry) => entry.full_name) ?? [];
  if (installation.total_count !== 1 || names.length !== 1 || names[0] !== repository) {
    throw new Error('Installation token is not limited to the expected repository');
  }
  if (operation === 'verify') return { role, repository, verified: true };
  if (operation === 'issue-create') {
    const result = await request(`${apiBase}/issues`, 'POST', {
      title: input.AIDD_TITLE.trim(),
      body: input.AIDD_BODY,
    });
    if (
      !Number.isInteger(result.number) ||
      result.html_url !== `${apiBase.replace('api.github.com/repos', 'github.com')}/issues/${result.number}`
    ) {
      throw new Error('GitHub did not return an issue in the expected repository');
    }
    return { role, operation, number: result.number, url: result.html_url };
  }
  if (operation === 'issue-comment') {
    const issue = await request(`${apiBase}/issues/${number}`);
    if (issue.pull_request || issue.state !== 'open') throw new Error('PO comments require an open issue, not a PR');
    const result = await request(`${apiBase}/issues/${number}/comments`, 'POST', { body: input.AIDD_BODY });
    if (!Number.isInteger(result.id)) throw new Error('GitHub did not confirm the issue comment');
    return { role, operation, number: Number(number), commentId: result.id };
  }
  const pr = await request(`${apiBase}/pulls/${number}`);
  if (pr.state !== 'open' || pr.head?.sha !== input.AIDD_EXPECTED_HEAD_SHA) {
    throw new Error('PR is closed or its head changed since QA reviewed it');
  }
  const result = await request(`${apiBase}/pulls/${number}/reviews`, 'POST', {
    body: input.AIDD_BODY,
    event: input.AIDD_REVIEW_EVENT,
    commit_id: input.AIDD_EXPECTED_HEAD_SHA,
  });
  const expectedState = input.AIDD_REVIEW_EVENT === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'COMMENTED';
  if (!Number.isInteger(result.id) || result.state?.toUpperCase() !== expectedState) {
    throw new Error('GitHub did not confirm a submitted PR review');
  }
  const current = await request(`${apiBase}/pulls/${number}`);
  if (current.state !== 'open' || current.head?.sha !== input.AIDD_EXPECTED_HEAD_SHA) {
    throw new Error('PR head changed during QA review submission; review is stale');
  }
  return { role, operation, number: Number(number), reviewId: result.id, state: result.state, head: input.AIDD_EXPECTED_HEAD_SHA };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await runDispatch(process.env)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
