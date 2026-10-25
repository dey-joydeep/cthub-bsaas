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
requiredPath('docs/aidd/README.md');
requiredPath('docs/aidd/codex-operating-model.md');
requiredPath('docs/aidd/codex-task-policy.md');
requiredPath('docs/aidd/codex-review-checklist.md');
requiredPath('docs/aidd/codex-validation-commands.md');
requiredPath('docs/quality-standards/production-documentation-standard.md');
requiredPath('docs/quality-standards/visual-collaboration-guideline.md');
requiredPath('.codex/config.toml');
requiredPath('.codex/prompts');
requiredPath('.agents/skills');

requiredContent('AGENTS.md', [/AIDD/i, /docs\/aidd\/README\.md/]);
requiredContent('docs/aidd/README.md', [/Codex AIDD/i, /codex-operating-model\.md/, /codex-task-policy\.md/]);
requiredContent('docs/aidd/codex-operating-model.md', [/Standard AIDD flow/i, /FRD\/FNRD\/HLD\/LLD\/API\/validation\/web\/test/i]);
requiredContent('docs/aidd/codex-task-policy.md', [/New task/i, /Continuation fix/i]);
requiredContent('docs/aidd/codex-validation-commands.md', [/npx nx/i]);
requiredContent('docs/aidd/codex-review-checklist.md', [/Scope and traceability/i, /Tests and validation/i]);
optionalContent('package.json', [/"aidd:check"/, /"aidd:assets"/, /"aidd:links"/]);

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
