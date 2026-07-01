import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';

const root = process.cwd();
const scanRoots = ['docs', '.codex', '.agents'];
const errors = [];
const warnings = [];
const ignoredDirs = new Set(['node_modules', 'dist', 'coverage', '.git', '.nx']);

// Legacy/archive docs and broad upstream skills have known pre-existing link debt.
// Keep this AIDD check focused on active project AIDD/Codex documentation.
const ignoredPathPrefixes = [
  'docs/bk/',
  '.agents/skills/playwright-best-practices/',
];

function toRepoRelativePath(filePath) {
  return relative(root, filePath).replaceAll('\\', '/');
}

function isInsideRepo(path) {
  const repoRelativePath = relative(root, path);
  return repoRelativePath === '' || (!repoRelativePath.startsWith('..') && !isAbsolute(repoRelativePath));
}

function shouldIgnorePath(filePath) {
  const repoPath = toRepoRelativePath(filePath);
  return ignoredPathPrefixes.some((prefix) => repoPath === prefix.slice(0, -1) || repoPath.startsWith(prefix));
}

function walk(dir, files = []) {
  if (!existsSync(dir) || shouldIgnorePath(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    if (shouldIgnorePath(fullPath)) {
      continue;
    }

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (extname(entry).toLowerCase() === '.md') {
      files.push(fullPath);
    }
  }
  return files;
}

function stripAnchor(target) {
  const hashIndex = target.indexOf('#');
  return hashIndex >= 0 ? target.slice(0, hashIndex) : target;
}

function isExternal(target) {
  return /^(https?:|mailto:|tel:)/i.test(target);
}

function isReferenceStyle(target) {
  return target.startsWith('[') || target.length === 0;
}

function stripLinkTitle(rawTarget) {
  return rawTarget
    .replace(/\s+"[^"]*"\s*$/, '')
    .replace(/\s+'[^']*'\s*$/, '')
    .replace(/\s+\([^)]*\)?\s*$/, '')
    .trim();
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const linkPattern = /!??\[[^\]\n]*\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    const targetWithoutTitle = stripLinkTitle(rawTarget);
    const target = stripAnchor(targetWithoutTitle);

    if (isExternal(targetWithoutTitle) || isReferenceStyle(target)) {
      continue;
    }

    if (target.startsWith('/')) {
      warnings.push(`Absolute local link in ${toRepoRelativePath(filePath)}: ${rawTarget}`);
      continue;
    }

    const resolved = normalize(join(dirname(filePath), decodeURIComponent(target)));
    if (!isInsideRepo(resolved)) {
      errors.push(`Link escapes repository root in ${toRepoRelativePath(filePath)}: ${rawTarget}`);
      continue;
    }

    if (!existsSync(resolved)) {
      errors.push(`Broken local link in ${toRepoRelativePath(filePath)}: ${rawTarget}`);
    }
  }
}

for (const scanRoot of scanRoots) {
  const fullRoot = join(root, scanRoot);
  for (const filePath of walk(fullRoot)) {
    checkFile(filePath);
  }
}

if (warnings.length > 0) {
  console.warn('Markdown link warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('Markdown link check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('Markdown link check passed.');
}
