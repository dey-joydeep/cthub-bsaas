#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const allowedTypes = new Set(['feature', 'fix', 'chore', 'docs', 'test', 'refactor', 'style', 'ci']);
const releaseName = /^release\/v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const releaseTag = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const issueClosingReference = /\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)?#\d+\b/i;

export function assessBranchName(name) {
  if (releaseName.test(name)) return [];
  const match = name?.match(/^([a-z]+)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match || !allowedTypes.has(match[1]) || match[2].length > 50) {
    return [`Branch ${name ?? '(missing)'} must use an allowed type and a lowercase kebab-case description of at most 50 characters`];
  }
  return [];
}

export function assessReleaseTag(name) {
  return releaseTag.test(name) ? [] : [`Release tag ${name ?? '(missing)'} must use vMAJOR.MINOR.PATCH`];
}

export function assessPrPolicy({ head, base, body }) {
  const errors = assessBranchName(head);
  if (base !== 'main' && !releaseName.test(base)) {
    errors.push(`PR target ${base ?? '(missing)'} is neither main nor a named release branch; retarget after dependent PRs merge`);
  }
  if (releaseName.test(base) && !/^(fix|ci)\//.test(head ?? '')) {
    errors.push('Release maintenance PRs must use fix/ or ci/ source branches');
  }
  if (!issueClosingReference.test(body ?? '')) errors.push('PR body must link its tracking issue with Closes, Fixes, or Resolves #number');
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, value] = process.argv.slice(2);
    if (!value || process.argv.length !== 4 || !['--branch', '--tag', '--event'].includes(mode)) {
      throw new Error('Usage: npm run aidd:branch-policy -- --branch <name> | --tag <name> | --event <GitHub-event-json>');
    }
    const errors =
      mode === '--branch'
        ? assessBranchName(value)
        : mode === '--tag'
          ? assessReleaseTag(value)
          : (() => {
              const event = JSON.parse(readFileSync(value, 'utf8'));
              if (!event.pull_request) throw new Error('GitHub event does not contain a pull request');
              return assessPrPolicy({
                head: event.pull_request.head?.ref,
                base: event.pull_request.base?.ref,
                body: event.pull_request.body,
              });
            })();
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Branch and PR policy passed.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
