#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import prettier from 'prettier';

function git(root, args, encoding = 'utf8') {
  return execFileSync('git', args, { cwd: root, encoding, maxBuffer: 16 * 1024 * 1024 });
}

async function main() {
  const [base, head, ...extra] = process.argv.slice(2);
  const workingTree = base === '--worktree' && !head && extra.length === 0;
  if (!workingTree && (!base || !head || extra.length)) {
    throw new Error('Usage: npm run aidd:format:changed -- <base-ref> <head-ref> | --worktree');
  }
  const root = resolve(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim());
  const tracked = git(
    root,
    ['diff', '--name-only', '-z', '--diff-filter=ACMRT', workingTree ? 'HEAD' : `${base}...${head}`, '--'],
    'buffer',
  )
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  const untracked = workingTree
    ? git(root, ['ls-files', '--others', '--exclude-standard', '-z'], 'buffer').toString('utf8').split('\0').filter(Boolean)
    : [];
  const changed = [...new Set([...tracked, ...untracked])];
  const failures = [];
  let checked = 0;
  for (const file of changed) {
    const path = join(root, file);
    if (!lstatSync(path).isFile()) continue;
    const info = await prettier.getFileInfo(path, { ignorePath: join(root, '.prettierignore') });
    if (info.ignored || !info.inferredParser) continue;
    checked += 1;
    const content = readFileSync(path, 'utf8');
    const config = (await prettier.resolveConfig(path)) ?? {};
    if (!(await prettier.check(content, { ...config, filepath: path }))) failures.push(file);
  }
  if (failures.length) throw new Error(`Prettier failed for changed files:\n${failures.map((file) => `- ${file}`).join('\n')}`);
  console.log(`Prettier checked ${checked} of ${changed.length} changed paths.`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
