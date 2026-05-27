import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative } from 'node:path';

const root = process.cwd();
const scanRoots = ['docs', '.codex', '.agents'];
const errors = [];
const warnings = [];
const ignoredDirs = new Set(['node_modules', 'dist', 'coverage', '.git', '.nx']);

function walk(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
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

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const linkPattern = /!??\[[^\]\n]*\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    const targetWithoutTitle = rawTarget.split(/\s+"/)[0].trim();
    const target = stripAnchor(targetWithoutTitle);

    if (isExternal(targetWithoutTitle) || isReferenceStyle(target)) {
      continue;
    }

    if (target.startsWith('/')) {
      warnings.push(`Absolute local link in ${relative(root, filePath)}: ${rawTarget}`);
      continue;
    }

    const resolved = normalize(join(dirname(filePath), decodeURIComponent(target)));
    if (!resolved.startsWith(root)) {
      errors.push(`Link escapes repository root in ${relative(root, filePath)}: ${rawTarget}`);
      continue;
    }

    if (!existsSync(resolved)) {
      errors.push(`Broken local link in ${relative(root, filePath)}: ${rawTarget}`);
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
