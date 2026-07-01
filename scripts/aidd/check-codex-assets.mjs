import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function exists(path) {
  return existsSync(join(root, path));
}

function listDirs(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    return [];
  }

  return readdirSync(fullPath)
    .filter((entry) => statSync(join(fullPath, entry)).isDirectory())
    .sort();
}

function requireFile(path) {
  if (!exists(path)) {
    errors.push(`Missing required file: ${path}`);
  }
}

function checkPrompt(path) {
  requireFile(path);
  if (!exists(path)) {
    return;
  }

  const content = read(path).trim();
  if (content.length < 80) {
    errors.push(`Prompt template is too small or empty: ${path}`);
  }
  if (!content.includes('```text')) {
    warnings.push(`Prompt template does not contain a text prompt block: ${path}`);
  }
}

function parseSkillFrontMatter(content) {
  if (!content.startsWith('---')) {
    return null;
  }

  const end = content.indexOf('\n---', 3);
  if (end < 0) {
    return null;
  }

  return content.slice(3, end).trim();
}

function checkSkill(skillName) {
  const path = `.agents/skills/${skillName}/SKILL.md`;
  requireFile(path);
  if (!exists(path)) {
    return;
  }

  const content = read(path);
  const frontMatter = parseSkillFrontMatter(content);
  if (!frontMatter) {
    errors.push(`Skill is missing YAML front matter: ${path}`);
    return;
  }

  if (!/^name:\s*\S+/m.test(frontMatter)) {
    errors.push(`Skill is missing name in front matter: ${path}`);
  }
  if (!/^description:\s*\S+/m.test(frontMatter)) {
    errors.push(`Skill is missing description in front matter: ${path}`);
  }
}

requireFile('.codex/config.toml');
requireFile('docs/aidd/README.md');

const promptPaths = [
  '.codex/prompts/plan-feature.md',
  '.codex/prompts/implement-from-lld.md',
  '.codex/prompts/review-diff.md',
  '.codex/prompts/fix-ci.md',
  '.codex/prompts/create-tests.md',
];

for (const path of promptPaths) {
  checkPrompt(path);
}

const configPath = '.codex/config.toml';
if (exists(configPath)) {
  const config = read(configPath);
  const agentConfigMatches = [...config.matchAll(/config_file\s*=\s*"([^"]+)"/g)];
  for (const match of agentConfigMatches) {
    const agentPath = `.codex/${match[1]}`;
    requireFile(agentPath);
  }
}

const skillNames = listDirs('.agents/skills');
if (skillNames.length === 0) {
  warnings.push('No repo-scoped skills found under .agents/skills.');
}
for (const skillName of skillNames) {
  checkSkill(skillName);
}

if (warnings.length > 0) {
  console.warn('Codex asset warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('Codex asset check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('Codex asset check passed.');
}
