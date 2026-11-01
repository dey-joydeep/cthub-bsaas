import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

function requiredPath(path) {
  if (!existsSync(join(root, path))) {
    errors.push(`Missing required path: ${path}`);
  }
}

function requiredContent(path, patterns) {
  const filePath = join(root, path);
  if (!existsSync(filePath)) {
    errors.push(`Missing required file: ${path}`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      errors.push(`File ${path} does not match required pattern: ${pattern}`);
    }
  }
}

function optionalContent(path, patterns) {
  const filePath = join(root, path);
  if (!existsSync(filePath)) {
    warnings.push(`Optional file not found: ${path}`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      warnings.push(`File ${path} does not match optional pattern: ${pattern}`);
    }
  }
}

requiredPath('AGENTS.md');
requiredPath('README.md');
requiredPath('docs/aidd/README.md');
requiredPath('docs/aidd/development-lifecycle.md');
requiredPath('docs/aidd/autonomous-recovery.md');
requiredPath('docs/aidd/change-hygiene.md');
requiredPath('docs/aidd/database-access-policy.md');
requiredPath('docs/aidd/dependency-policy.md');
requiredPath('docs/aidd/agent-activation.md');
requiredPath('docs/aidd/role-directory-access.md');
requiredPath('apps/web/AGENTS.md');
requiredPath('scripts/aidd/test-database-target.test.mjs');
requiredPath('docs/status/aidd/README.md');
requiredPath('docs/aidd/codex-operating-model.md');
requiredPath('docs/aidd/codex-task-policy.md');
requiredPath('docs/aidd/codex-review-checklist.md');
requiredPath('docs/aidd/codex-validation-commands.md');
requiredPath('docs/quality-standards/production-documentation-standard.md');
requiredPath('docs/quality-standards/visual-collaboration-guideline.md');
requiredPath('.codex/config.toml');
requiredPath('.codex/prompts');
requiredPath('.agents/skills');
requiredPath('.agents/AGENTS.md');
requiredPath('.agents/agents/product-owner.md');
requiredPath('.agents/agents/qa-engineer.md');
requiredPath('.agents/agents/release-agent.md');
requiredPath('.agents/agents/database-architect.md');
requiredPath('.codex/agents/database-reviewer.toml');
requiredPath('scripts/aidd/run-agy-agent.mjs');
requiredPath('scripts/aidd/agent-work-ledger.mjs');
requiredPath('scripts/aidd/source-checkpoint.mjs');
requiredPath('scripts/aidd/check-changed-format.mjs');
requiredPath('scripts/aidd/check-instruction-drift.mjs');
requiredPath('scripts/aidd/smoke-installed-toolchain.mjs');
requiredPath('scripts/aidd/check-pr-automation-evidence.mjs');
requiredPath('scripts/aidd/project-tracking.mjs');
requiredPath('scripts/aidd/track-issue.mjs');
requiredPath('docs/aidd/github-app-identities.md');
requiredPath('scripts/aidd/check-dependency-policy.mjs');
requiredPath('scripts/aidd/check-dependency-change.mjs');
requiredPath('scripts/aidd/check-branch-policy.mjs');
requiredPath('.husky/pre-commit');
requiredPath('.husky/pre-push');
requiredPath('.npmrc');
requiredPath('.husky/install.mjs');
requiredPath('.lintstagedrc');
requiredPath('.github/pull_request_template.md');

const codexConfig = readFileSync(join(root, '.codex/config.toml'), 'utf8');
for (const match of codexConfig.matchAll(/\[agents\.([^\]]+)\]\s*\r?\ndescription = "([^"]+)"\s*\r?\nconfig_file = "agents\/([^"]+)"/g)) {
  const [, name, description, file] = match;
  const path = `.codex/agents/${file}`;
  if (!existsSync(join(root, path))) {
    errors.push(`Missing Codex agent: ${path}`);
    continue;
  }
  const content = readFileSync(join(root, path), 'utf8');
  if (!content.includes(`name = "${name}"`) || !content.includes(`description = "${description}"`)) {
    errors.push(`Codex agent metadata differs from registration: ${path}`);
  }
}

for (const path of [
  'GEMINI.md',
  'apps/api/GEMINI.md',
  'apps/e2e/GEMINI.md',
  'docs/GEMINI.md',
  'libs/server/GEMINI.md',
  'libs/server/features/auth/GEMINI.md',
  'libs/shared/GEMINI.md',
  'libs/web/GEMINI.md',
]) {
  if (existsSync(join(root, path))) errors.push(`Duplicate instruction file: ${path}`);
}

requiredContent('AGENTS.md', [
  /AIDD/i,
  /docs\/aidd\/README\.md/,
  /development-lifecycle\.md/,
  /role-directory-access\.md/,
  /apps\/web\/AGENTS\.md/,
]);
requiredContent('README.md', [/scalable SaaS platform for beauty salons/i, /development-lifecycle\.md/]);
requiredContent('docs/aidd/README.md', [
  /AI-Driven Development Guide/i,
  /development-lifecycle\.md/,
  /codex-task-policy\.md/,
  /change-hygiene\.md/,
]);
requiredContent('docs/aidd/development-lifecycle.md', [
  /QA participates from requirements through operation/i,
  /Codex is the required owner/i,
  /Gemini 3\.8 Flash/i,
  /Critical security/i,
]);
requiredContent('.agents/AGENTS.md', [/Gemini 3\.8 Flash/i, /Codex/i, /development-lifecycle\.md/]);
requiredContent('.github/pull_request_template.md', [
  /Tracking issue:/i,
  /Independent Codex review link/i,
  /Codex security check link/i,
  /Base branch and dependent PRs:/i,
  /Broad-change phase plan and rollback/i,
  /Real user-path and negative-case evidence/i,
  /Current-head automated evidence/i,
]);
requiredContent('.github/PULL_REQUEST_TEMPLATE/aidd-implementation.md', [
  /Base branch and dependent PRs:/i,
  /Real user-path and negative-case evidence/i,
  /Current-head automated evidence/i,
]);
requiredContent('docs/aidd/codex-operating-model.md', [/Standard AIDD flow/i, /FRD\/FNRD\/HLD\/LLD\/API\/validation\/web\/test/i]);
requiredContent('docs/aidd/codex-task-policy.md', [/New task/i, /Continuation fix/i]);
requiredContent('docs/aidd/codex-validation-commands.md', [/npx nx/i]);
requiredContent('docs/aidd/codex-review-checklist.md', [/Scope and traceability/i, /Tests and validation/i]);
optionalContent('package.json', [/"aidd:check"/, /"aidd:assets"/, /"aidd:links"/]);
requiredContent('package.json', [
  /"prepare"\s*:\s*"node \.husky\/install\.mjs"/,
  /"aidd:ledger"/,
  /"aidd:ledger:test"/,
  /"aidd:source-checkpoint"/,
  /"aidd:format:changed"/,
  /"aidd:format:test"/,
  /"aidd:db-guard:test"/,
  /"aidd:instruction-drift"/,
  /"aidd:instruction-drift:test"/,
  /"aidd:premerge"/,
  /"aidd:premerge:test"/,
  /"aidd:track-issue"/,
  /"aidd:track-issue:test"/,
  /"deps:policy"/,
  /"deps:change"/,
  /"aidd:branch-policy"/,
]);

if (warnings.length > 0) {
  console.warn('AIDD setup warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('AIDD setup check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('AIDD setup check passed.');
}
