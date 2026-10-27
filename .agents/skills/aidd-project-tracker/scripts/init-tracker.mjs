#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const optionNames = new Set([
  'epic-title',
  'epic-body',
  'epic-body-file',
  'epic-number',
  'repo',
  'sub-issues-json',
  'sub-issues-file',
  'project-owner',
  'project-number',
]);
const selectFields = ['Status', 'Priority', 'Size', 'Domain'];
const fieldNames = [...selectFields, 'Estimate', 'Start date', 'End date'];
const checklistStart = '<!-- aidd-checklist:start -->';
const checklistEnd = '<!-- aidd-checklist:end -->';

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const options = { 'project-owner': 'dey-joydeep', 'project-number': '1', apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') {
      options.apply = true;
      continue;
    }
    if (!argument.startsWith('--') || !optionNames.has(argument.slice(2))) {
      fail(`Unknown option: ${argument}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) {
      fail(`${argument} needs a value`);
    }
    options[argument.slice(2)] = value;
  }
  for (const name of ['epic-title', 'repo']) {
    if (!options[name]?.trim()) fail(`--${name} is required`);
  }
  if (Boolean(options['epic-body']) === Boolean(options['epic-body-file'])) {
    fail('Supply exactly one of --epic-body or --epic-body-file');
  }
  if (Boolean(options['sub-issues-json']) === Boolean(options['sub-issues-file'])) {
    fail('Supply exactly one of --sub-issues-json or --sub-issues-file');
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(options.repo)) fail('--repo must be owner/repo');
  if (!/^[1-9]\d*$/.test(options['project-number'])) fail('--project-number must be positive');
  if (options['epic-number'] && !/^[1-9]\d*$/.test(options['epic-number'])) {
    fail('--epic-number must be positive');
  }
  return options;
}

function readInput(options) {
  const epicBody = options['epic-body-file'] ? readFileSync(options['epic-body-file'], 'utf8').trim() : options['epic-body'].trim();
  if (epicBody.length < 80) fail('Epic body must describe a concrete objective and scope');
  if (epicBody.includes('### Epic Tracker') || epicBody.includes(checklistStart)) {
    fail('Do not include a checklist section in the Epic body; the script manages it');
  }
  const rawIssues = options['sub-issues-file'] ? readFileSync(options['sub-issues-file'], 'utf8') : options['sub-issues-json'];
  const issues = JSON.parse(rawIssues);
  if (!Array.isArray(issues) || issues.length < 2) {
    fail('An Epic needs at least two independent sub-issues');
  }
  const names = new Set();
  for (const [index, issue] of issues.entries()) {
    for (const field of ['title', 'body', 'status', 'priority', 'size', 'domain', 'start', 'end']) {
      if (typeof issue[field] !== 'string' || !issue[field].trim()) {
        fail(`Sub-issue ${index + 1}: ${field} is required`);
      }
    }
    if (names.has(issue.title)) fail(`Duplicate sub-issue title: ${issue.title}`);
    names.add(issue.title);
    if (typeof issue.estimate !== 'number' || !Number.isFinite(issue.estimate) || issue.estimate < 0) {
      fail(`Sub-issue ${index + 1}: estimate must be a non-negative number`);
    }
    for (const field of ['start', 'end']) {
      const value = issue[field];
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
        !new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
      ) {
        fail(`Sub-issue ${index + 1}: ${field} must be a real YYYY-MM-DD date`);
      }
    }
    if (issue.end < issue.start) fail(`Sub-issue ${index + 1}: end precedes start`);
  }
  return { epicBody, issues };
}

function gh(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  if (result.error) fail(`gh could not run: ${result.error.message}`);
  if (result.status !== 0) fail(`gh ${args.slice(0, 2).join(' ')} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function ghJson(args) {
  const output = gh(args);
  try {
    return JSON.parse(output);
  } catch {
    fail(`gh ${args.slice(0, 2).join(' ')} did not return JSON`);
  }
}

function key(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function marker(epicKey, sliceKey) {
  return sliceKey ? `<!-- aidd-epic-key:${epicKey};slice-key:${sliceKey} -->` : `<!-- aidd-epic-key:${epicKey} -->`;
}

function issueSearch(repo, title) {
  return ghJson([
    'issue',
    'list',
    '--repo',
    repo,
    '--state',
    'all',
    '--search',
    `${title} in:title`,
    '--json',
    'number,title,body',
    '--limit',
    '1000',
  ]).filter((issue) => issue.title === title);
}

function findOrCreateIssue({ repo, title, body, expectedMarker, number }) {
  if (number) {
    const issue = ghJson(['issue', 'view', number, '--repo', repo, '--json', 'number,title,body']);
    if (issue.title !== title || !issue.body.includes(expectedMarker)) {
      fail(`Issue #${number} does not match the requested Epic title and marker`);
    }
    return issue;
  }
  const matches = issueSearch(repo, title);
  const owned = matches.filter((issue) => issue.body.includes(expectedMarker));
  if (owned.length === 1) return owned[0];
  if (owned.length > 1 || matches.length > 0) {
    fail(`Existing issue with title "${title}" needs manual reconciliation before retry`);
  }
  const url = gh(['issue', 'create', '--repo', repo, '--title', title, '--body', body]);
  const createdNumber = url.match(/\/issues\/(\d+)$/)?.[1];
  if (!createdNumber) fail(`Could not read issue number from create result: ${url}`);
  const created = ghJson(['issue', 'view', createdNumber, '--repo', repo, '--json', 'number,title,body']);
  if (created.title !== title || !created.body.includes(expectedMarker)) {
    fail(`Created issue #${createdNumber} failed verification`);
  }
  console.log(`Created ${url}`);
  return created;
}

function projectContext(owner, number) {
  const project = ghJson(['project', 'view', number, '--owner', owner, '--format', 'json']);
  const fields = ghJson(['project', 'field-list', number, '--owner', owner, '--format', 'json', '--limit', '100']).fields;
  for (const name of fieldNames) {
    if (!fields.some((field) => field.name === name)) fail(`Project field missing: ${name}`);
  }
  return { id: project.id, fields };
}

function projectItems(owner, number) {
  const result = ghJson(['project', 'item-list', number, '--owner', owner, '--format', 'json', '--limit', '1000']);
  if (result.totalCount > result.items.length) fail('Project has more than 1000 items; update lookup before writing');
  return result.items;
}

function ensureProjectItem({ owner, number, repo, issueNumber }) {
  const url = `https://github.com/${repo}/issues/${issueNumber}`;
  const existing = projectItems(owner, number).find((item) => item.content?.url === url);
  if (existing) return existing.id;
  const added = ghJson(['project', 'item-add', number, '--owner', owner, '--url', url, '--format', 'json']);
  if (!added.id) fail(`Project item-add returned no ID for issue #${issueNumber}`);
  const verified = projectItems(owner, number).find((item) => item.content?.url === url);
  if (verified?.id !== added.id) fail(`Project item for issue #${issueNumber} failed verification`);
  return added.id;
}

function ensureParent(repo, epicNumber, subNumber) {
  const [owner, name] = repo.split('/');
  const query =
    'query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){issue(number:$number){id parent{number}}}}';
  const parentInfo = () =>
    ghJson(['api', 'graphql', '-f', `query=${query}`, '-f', `owner=${owner}`, '-f', `repo=${name}`, '-F', `number=${subNumber}`]).data
      ?.repository?.issue;
  const issue = parentInfo();
  if (!issue?.id) fail(`Could not read parent for issue #${subNumber}`);
  if (issue.parent?.number === epicNumber) return;
  if (issue.parent) fail(`Issue #${subNumber} already belongs to Epic #${issue.parent.number}`);
  const mutation = 'mutation($epic:ID!,$sub:ID!){addSubIssue(input:{issueId:$epic,subIssueId:$sub}){clientMutationId}}';
  const epicId = ghJson(['issue', 'view', String(epicNumber), '--repo', repo, '--json', 'id']).id;
  ghJson(['api', 'graphql', '-f', `query=${mutation}`, '-f', `epic=${epicId}`, '-f', `sub=${issue.id}`]);
  if (parentInfo()?.parent?.number !== epicNumber) fail(`Parent link for issue #${subNumber} failed verification`);
}

function ensureFields({ project, itemId, issue, owner, number, repo, issueNumber }) {
  const expected = {
    Status: issue.status,
    Priority: issue.priority,
    Size: issue.size,
    Domain: issue.domain,
    Estimate: issue.estimate,
    'Start date': issue.start,
    'End date': issue.end,
  };
  for (const [name, value] of Object.entries(expected)) {
    const field = project.fields.find((entry) => entry.name === name);
    const args = ['project', 'item-edit', '--id', itemId, '--project-id', project.id, '--field-id', field.id];
    if (selectFields.includes(name)) {
      const option = field.options?.find((entry) => entry.name === value);
      if (!option) fail(`Project ${name} option missing: ${value}`);
      args.push('--single-select-option-id', option.id);
    } else {
      args.push(name === 'Estimate' ? '--number' : '--date', String(value));
    }
    gh(args);
  }
  const item = projectItems(owner, number).find((entry) => entry.content?.url === `https://github.com/${repo}/issues/${issueNumber}`);
  for (const [name, value] of Object.entries(expected)) {
    if (item?.[name.toLowerCase()] !== value) {
      fail(`Project field ${name} failed verification for issue #${issueNumber}`);
    }
  }
}

function ensureChecklist(repo, epic, epicKey, children) {
  const current = ghJson(['issue', 'view', String(epic.number), '--repo', repo, '--json', 'body']);
  if (current.body.includes('### Epic Tracker') && !current.body.includes(checklistStart)) {
    fail(`Epic #${epic.number} has an unmanaged tracker section; reconcile it before retry`);
  }
  const lines = children.map((child) => `- [ ] #${child.number} - ${child.title}`).join('\n');
  const section = `${checklistStart}\n### Epic Tracker\n${lines}\n${checklistEnd}`;
  const pattern = /<!-- aidd-checklist:start -->[\s\S]*?<!-- aidd-checklist:end -->/;
  const updated = pattern.test(current.body) ? current.body.replace(pattern, section) : `${current.body.trim()}\n\n${section}`;
  if (!updated.includes(marker(epicKey))) fail('Epic marker disappeared before checklist update');
  if (current.body !== updated) gh(['issue', 'edit', String(epic.number), '--repo', repo, '--body', updated]);
  const verified = ghJson(['issue', 'view', String(epic.number), '--repo', repo, '--json', 'body']);
  if (!verified.body.includes(section)) fail('Epic checklist update failed verification');
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const { epicBody, issues } = readInput(options);
  const epicKey = key(`${options.repo}:${options['epic-title']}`);
  console.log(`${options.apply ? 'Apply' : 'Dry run'}: ${options['epic-title']} (${issues.length} slices)`);
  if (!options.apply) {
    console.log('No GitHub changes made. Pass --apply to create or resume this Epic.');
    return;
  }

  gh(['auth', 'status']);
  const project = projectContext(options['project-owner'], options['project-number']);
  const epic = findOrCreateIssue({
    repo: options.repo,
    title: options['epic-title'],
    body: `${epicBody}\n\n${marker(epicKey)}`,
    expectedMarker: marker(epicKey),
    number: options['epic-number'],
  });
  ensureProjectItem({
    owner: options['project-owner'],
    number: options['project-number'],
    repo: options.repo,
    issueNumber: epic.number,
  });

  const children = [];
  for (const issue of issues) {
    const childMarker = marker(epicKey, key(issue.title));
    const child = findOrCreateIssue({
      repo: options.repo,
      title: issue.title,
      body: `${issue.body.trim()}\n\n${childMarker}`,
      expectedMarker: childMarker,
    });
    ensureParent(options.repo, epic.number, child.number);
    const itemId = ensureProjectItem({
      owner: options['project-owner'],
      number: options['project-number'],
      repo: options.repo,
      issueNumber: child.number,
    });
    ensureFields({
      project,
      itemId,
      issue,
      owner: options['project-owner'],
      number: options['project-number'],
      repo: options.repo,
      issueNumber: child.number,
    });
    children.push(child);
  }
  ensureChecklist(options.repo, epic, epicKey, children);
  console.log(`Epic #${epic.number} and ${children.length} sub-issues verified on project board.`);
}

try {
  main();
} catch (error) {
  console.error(`Tracker initialization stopped: ${error.message}`);
  process.exitCode = 1;
}
