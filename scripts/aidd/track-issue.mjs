#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectItemListArgs, projectNumber, projectOwner } from './project-tracking.mjs';

const editableFields = new Map([
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['size', 'Size'],
  ['domain', 'Domain'],
]);

export function parseOptions(argv) {
  const options = { owner: projectOwner, project: String(projectNumber), apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--apply') {
      options.apply = true;
      continue;
    }
    if (!['--repo', '--issue', '--owner', '--project', ...[...editableFields.keys()].map((name) => `--${name}`)].includes(key)) {
      throw new Error(`Unknown option: ${key}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} needs a value`);
    options[key.slice(2)] = value;
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repo ?? '')) throw new Error('--repo must be owner/repo');
  if (!/^[1-9]\d*$/.test(options.issue ?? '')) throw new Error('--issue must be a positive issue number');
  if (!/^[1-9]\d*$/.test(options.project)) throw new Error('--project must be a positive project number');
  if (!/^[A-Za-z0-9_.-]+$/.test(options.owner)) throw new Error('--owner must be a GitHub login');
  return options;
}

function ghJson(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw new Error(`gh could not run: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${result.stderr.trim()}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`gh ${args.slice(0, 2).join(' ')} did not return JSON`);
  }
}

function projectItems(options, client) {
  const result = client(projectItemListArgs(options.owner, options.project));
  if (result.totalCount > result.items.length) throw new Error('Project item lookup exceeded 1000 items');
  return result.items;
}

export function proposedChanges(item, fields, options) {
  const changes = [];
  for (const [key, name] of editableFields) {
    const desired = options[key];
    if (!desired) continue;
    const field = fields.find((entry) => entry.name === name);
    if (!field?.options?.some((option) => option.name === desired)) throw new Error(`${name} option does not exist: ${desired}`);
    if (item?.[key] !== desired) changes.push({ field: name, from: item?.[key] ?? null, to: desired });
  }
  if (!item?.status && !options.status) throw new Error('A new or statusless Project item needs --status');
  return changes;
}

export function trackIssue(options, client = ghJson) {
  const issue = client(['issue', 'view', options.issue, '--repo', options.repo, '--json', 'number,url,state']);
  if (issue.url !== `https://github.com/${options.repo}/issues/${options.issue}`)
    throw new Error('Issue URL does not match requested repository');
  if (issue.state !== 'OPEN') throw new Error('Only open tracking issues can be moved into an active Project status');
  const project = client(['project', 'view', options.project, '--owner', options.owner, '--format', 'json']);
  if (!project.id) throw new Error('Project ID is unavailable');
  const fields = client(['project', 'field-list', options.project, '--owner', options.owner, '--format', 'json', '--limit', '100']).fields;
  const item = projectItems(options, client).find((entry) => entry.content?.url === issue.url);
  const changes = proposedChanges(item, fields, options);
  const plan = { issue: issue.url, project: project.url, add: !item, changes, applied: options.apply };
  if (!options.apply) return plan;

  const edits = changes.map((change) => {
    const field = fields.find((entry) => entry.name === change.field);
    const option = field?.options?.find((entry) => entry.name === change.to);
    if (!field?.id || !option?.id) throw new Error(`${change.field} field or option ID is unavailable`);
    return { fieldId: field.id, optionId: option.id };
  });

  let itemId = item?.id;
  if (!item) {
    const added = client(['project', 'item-add', options.project, '--owner', options.owner, '--url', issue.url, '--format', 'json']);
    if (!added.id) throw new Error('Project item-add returned no ID');
    itemId = added.id;
  }
  if (edits.length && !itemId) throw new Error('Project item ID is unavailable');
  for (const edit of edits) {
    client([
      'project',
      'item-edit',
      '--id',
      itemId,
      '--project-id',
      project.id,
      '--field-id',
      edit.fieldId,
      '--single-select-option-id',
      edit.optionId,
      '--format',
      'json',
    ]);
  }
  const verified = projectItems(options, client).find((entry) => entry.content?.url === issue.url);
  if (!verified) throw new Error('Project item was not found after apply');
  for (const change of changes) {
    const key = [...editableFields].find(([, name]) => name === change.field)?.[0];
    if (verified[key] !== change.to) throw new Error(`${change.field} update failed verification`);
  }
  if (!verified.status) throw new Error('Project item still has no Status');
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(trackIssue(parseOptions(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
