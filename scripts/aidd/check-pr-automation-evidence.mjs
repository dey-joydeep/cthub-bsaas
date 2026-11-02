import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assessProjectTracking, projectItemListArgs } from './project-tracking.mjs';

const reviewMarker = /<!-- codex-review-state:v1 (\{[^\n]+\}) -->/;

export function assessPrAutomationEvidence(pr, comments, reviewThreads, expectedBase) {
  const errors = [];
  if (pr.state !== 'OPEN' || pr.isDraft) errors.push('PR must be open and ready for review');
  if (!/^[a-f0-9]{40}$/.test(pr.headRefOid ?? '')) errors.push('PR head SHA is unavailable');
  if (!/^[a-f0-9]{40}$/.test(pr.baseRefOid ?? '')) errors.push('PR base SHA is unavailable');
  if (
    expectedBase &&
    pr.baseRefName !== expectedBase &&
    !/^release\/v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(pr.baseRefName ?? '')
  ) {
    errors.push(`PR targets ${pr.baseRefName ?? '(unknown)'}; retarget to ${expectedBase} after its dependent PRs merge`);
  }

  const checks = pr.statusCheckRollup ?? [];
  if (checks.length === 0) errors.push('No CI checks are reported for this PR head');
  if (
    !checks.some(
      (check) =>
        check.__typename === 'CheckRun' &&
        check.workflowName === 'CI/CD' &&
        check.name === 'Main Workflow' &&
        check.conclusion === 'SUCCESS',
    )
  ) {
    errors.push('Required Main Workflow check has not succeeded on this PR head');
  }
  for (const check of checks) {
    const optionalSkip =
      check.__typename === 'CheckRun' &&
      check.workflowName === 'CI/CD' &&
      check.name === 'Windows toolchain smoke' &&
      check.status === 'COMPLETED' &&
      check.conclusion === 'SKIPPED';
    const passed =
      check.__typename === 'StatusContext'
        ? check.state === 'SUCCESS'
        : (check.status === 'COMPLETED' && check.conclusion === 'SUCCESS') || optionalSkip;
    if (!passed) {
      errors.push(
        `CI check ${check.name ?? check.context ?? '(unnamed)'} is ${check.conclusion ?? check.state ?? check.status ?? 'unknown'}`,
      );
    }
  }

  const summaries = comments
    .filter((comment) => /^chatgpt-codex-connector(?:\[bot\])?$/.test(comment.user?.login ?? ''))
    .map((comment) => ({ comment, match: (comment.body ?? '').match(reviewMarker) }))
    .filter((entry) => entry.match)
    .sort((a, b) => (b.comment.updated_at ?? '').localeCompare(a.comment.updated_at ?? ''));
  if (summaries.length === 0) {
    errors.push('No Codex review summary was found; a usage-limit message is not review evidence');
  } else {
    let state;
    try {
      state = JSON.parse(summaries[0].match[1]);
    } catch {
      errors.push('The latest Codex review summary is malformed');
    }
    if (state) {
      const review = state.code_review;
      if (review?.status !== 'completed' || review.commit_sha !== pr.headRefOid || review.has_unresolved_findings !== false) {
        errors.push('Codex whole-PR review is incomplete, stale, or has unresolved findings');
      }
    }
  }

  const unresolved = reviewThreads.filter((thread) => thread.isResolved !== true).length;
  if (unresolved) errors.push(`${unresolved} review thread(s) remain unresolved`);
  return errors;
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function allReviewThreads(owner, name, number) {
  const threads = [];
  let cursor = null;
  do {
    const after = cursor ? `,after:${JSON.stringify(cursor)}` : '';
    const query = `query { repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}) { pullRequest(number:${number}) { reviewThreads(first:100${after}) { nodes { isResolved } pageInfo { hasNextPage endCursor } } } } }`;
    const response = JSON.parse(gh(['api', 'graphql', '-f', `query=${query}`]));
    const page = response.data?.repository?.pullRequest?.reviewThreads;
    if (!page) throw new Error('Cannot read PR review threads');
    threads.push(...page.nodes);
    if (threads.length > 2000) throw new Error('Review thread pagination exceeded safe limit');
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (page.pageInfo.hasNextPage && !cursor) throw new Error('Review thread cursor is missing');
  } while (cursor);
  return threads;
}

export function checkPrAutomationEvidence(number) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Usage: npm run aidd:premerge -- <PR-number>');
  const { nameWithOwner, defaultBranchRef } = JSON.parse(gh(['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef']));
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(nameWithOwner ?? '')) throw new Error('Cannot determine GitHub repository');
  if (!defaultBranchRef?.name) throw new Error('Cannot determine the repository default branch');
  const [owner, name] = nameWithOwner.split('/');
  const prArgs = [
    'pr',
    'view',
    String(number),
    '--repo',
    nameWithOwner,
    '--json',
    'state,isDraft,headRefOid,baseRefOid,baseRefName,body,statusCheckRollup',
  ];
  const before = JSON.parse(gh(prArgs));
  const commentPages = JSON.parse(gh(['api', '--paginate', '--slurp', `repos/${nameWithOwner}/issues/${number}/comments?per_page=100`]));
  const comments = commentPages.flat();
  const reviewThreads = allReviewThreads(owner, name, number);
  const project = JSON.parse(gh(projectItemListArgs()));
  if (project.totalCount > project.items.length) throw new Error('Project item lookup exceeded 1000 items');
  const pr = JSON.parse(gh(prArgs));
  if (
    before.headRefOid !== pr.headRefOid ||
    before.baseRefOid !== pr.baseRefOid ||
    before.baseRefName !== pr.baseRefName ||
    before.body !== pr.body
  ) {
    throw new Error('PR head, base, or tracking body changed while evidence was read; rerun the check');
  }
  const errors = [
    ...assessPrAutomationEvidence(pr, comments, reviewThreads, defaultBranchRef?.name),
    ...assessProjectTracking(pr.body, project.items, nameWithOwner),
  ];
  return {
    repository: nameWithOwner,
    number,
    head: pr.headRefOid,
    base: pr.baseRefOid,
    errors,
    manualChecks: ['Confirm the independent reviewer examined this base SHA', 'Verify QA and applicable Codex security evidence'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const number = Number(process.argv[2]);
    if (process.argv.length !== 3) throw new Error('Usage: npm run aidd:premerge -- <PR-number>');
    const result = checkPrAutomationEvidence(number);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
