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
requiredPath('scripts/aidd/run-agy-agent.mjs');
requiredPath('scripts/aidd/agent-work-ledger.mjs');
requiredPath('scripts/aidd/source-checkpoint.mjs');
requiredPath('scripts/aidd/check-changed-format.mjs');
requiredPath('.husky/pre-commit');
requiredPath('.husky/install.mjs');
requiredPath('.lintstagedrc');
requiredPath('.github/pull_request_template.md');

requiredContent('AGENTS.md', [/AIDD/i, /docs\/aidd\/README\.md/, /development-lifecycle\.md/]);
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
requiredContent('.github/pull_request_template.md', [/Tracking issue:/i, /Independent Codex review link/i, /Codex security check link/i]);
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
