#!/usr/bin/env node

/**
 * check-form-validation.mjs
 *
 * Enforces ADR-0006 across libs/web and apps/web:
 * 1. Checks that validated form fields inside <mat-form-field> contain matching <mat-error> tags.
 *    Carefully avoids false positives on optional fields, search inputs, or readonly controls.
 * 2. Checks that unit test files (*.spec.ts) do not use `TestBed.overrideComponent`,
 *    which corrupts Angular AOT template source-mapping for code coverage (Angular CLI #30127).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO_ROOT = resolve(process.cwd());
const WEB_DIRS = [join(REPO_ROOT, 'libs', 'web'), join(REPO_ROOT, 'apps', 'web')];

// Attributes that explicitly denote client-side HTML validation
const HTML_VALIDATOR_ATTR_REGEX =
  /\b(required|\[required\]\s*=\s*["']true["']|minlength\s*=|maxlength\s*=|pattern\s*=|min\s*=|max\s*=|type\s*=\s*["']email["'])\b/i;

export function walkDir(dir, filterFn) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath, filterFn));
      } else if (stat.isFile() && filterFn(fullPath)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist or be unreadable
  }
  return results;
}

export function extractScopedTsValidators(tsContent, formGroupName, controlName) {
  if (!controlName || !tsContent) return false;

  if (formGroupName) {
    // Find the definition of this specific form group in the TS file
    const groupRegex = new RegExp(
      `(?:protected|private|public|readonly)?\\s*${formGroupName}\\s*=\\s*(?:this\\.fb\\.[^;]+|new\\s+FormGroup\\([^;]+)`,
      's',
    );
    const groupMatch = groupRegex.exec(tsContent);
    if (groupMatch) {
      const groupBlock = groupMatch[0];
      return extractTsValidators(groupBlock, controlName);
    }
  }

  return extractTsValidators(tsContent, controlName);
}

export function extractTsValidators(tsContent, controlName) {
  if (!controlName || !tsContent) return false;
  // Match exact control property key: e.g. "displayName:", 'displayName':, or displayName:
  const pattern = new RegExp(
    `['"]?${controlName}['"]?\\s*:\\s*(?:this\\.fb\\.[^,;\\n]+|new\\s+FormControl[^,;\\n]+|\\[[^\\];\\n]+\\]|[^,;\\n]+)`,
    'g',
  );
  let match;
  while ((match = pattern.exec(tsContent)) !== null) {
    const chunk = match[0];
    if (/(?:Validators\s*\.\s*(?:required|min|max|minLength|maxLength|pattern|email)|requiredTrue|phoneNumberValidator)/i.test(chunk)) {
      return true;
    }
  }
  return false;
}

export function checkSpecContent(content, filePath = 'test.spec.ts') {
  const violations = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('.overrideComponent(')) {
      violations.push({
        file: filePath,
        line: idx + 1,
        rule: 'PROHIBIT_OVERRIDE_COMPONENT',
        message:
          'Avoid TestBed.overrideComponent(). It invalidates AOT template metadata and corrupts template code coverage (ADR-0006 & Angular Issue #30127). Use standard DI providers or standalone stub imports instead.',
      });
    }
  });
  return violations;
}

export function checkTemplateContent(htmlContent, tsContent = '', filePath = 'template.component.html') {
  const violations = [];
  if (!htmlContent.includes('<mat-form-field')) return violations;

  const fieldRegex = /<mat-form-field\b([^>]*)>([\s\S]*?)<\/mat-form-field>/gi;
  let match;

  while ((match = fieldRegex.exec(htmlContent)) !== null) {
    const fieldOpenTag = match[1];
    const fieldBody = match[2];
    const matchIndex = match.index;
    const lineNumber = htmlContent.substring(0, matchIndex).split('\n').length;

    const controlMatch = /<(input|mat-select|textarea)\b([^>]*)>/i.exec(fieldBody);
    if (!controlMatch) continue;

    const controlTag = controlMatch[1];
    const controlAttrs = controlMatch[2];

    // Exclude non-input, search, filter, or readonly controls (to prevent false positives)
    if (
      controlAttrs.includes('readonly') ||
      controlAttrs.includes('type="search"') ||
      /placeholder\s*=\s*["'][^"']*search/i.test(controlAttrs) ||
      /subscriptSizing\s*=\s*["']dynamic["']/i.test(fieldOpenTag)
    ) {
      continue;
    }

    const formControlMatch = /formControlName\s*=\s*["']([^"']+)["']/i.exec(controlAttrs);
    const controlName = formControlMatch ? formControlMatch[1] : null;

    // Detect enclosing formGroup name if present
    const priorContent = htmlContent.substring(0, matchIndex);
    const formGroupMatch = /(?:\[formGroup\]|formGroupName)\s*=\s*["']([^"']+)["'][^>]*>(?:(?!<\/form>)[\s\S])*$/i.exec(priorContent);
    const formGroupName = formGroupMatch ? formGroupMatch[1] : null;

    // Determine if validation is required:
    // 1. Explicit HTML attributes (required, pattern, etc.)
    const hasHtmlValidator = HTML_VALIDATOR_ATTR_REGEX.test(controlAttrs);
    // 2. Bound to a FormControl that has Validators in TypeScript within its form group
    const hasTsValidator = controlName ? extractScopedTsValidators(tsContent, formGroupName, controlName) : false;
    const isValidationExpected = hasHtmlValidator || hasTsValidator;

    // If validation is expected, verify <mat-error> exists inside this <mat-form-field>
    if (isValidationExpected) {
      const hasMatError = /<mat-error\b/i.test(fieldBody);
      if (!hasMatError) {
        violations.push({
          file: filePath,
          line: lineNumber,
          rule: 'MISSING_MAT_ERROR',
          message: `Validated control '<${controlTag}${controlName ? ` formControlName="${controlName}"` : ''}>' lacks a <mat-error> element inside its <mat-form-field>.`,
        });
      }
    }
  }

  return violations;
}

export function auditWorkspace(webDirs = WEB_DIRS) {
  const specFiles = [];
  const htmlFiles = [];

  for (const dir of webDirs) {
    specFiles.push(...walkDir(dir, (p) => p.endsWith('.spec.ts')));
    htmlFiles.push(...walkDir(dir, (p) => p.endsWith('.component.html')));
  }

  const violations = [];

  for (const filePath of specFiles) {
    const content = readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(REPO_ROOT, '').replace(/^[\\/]/, '');
    violations.push(...checkSpecContent(content, relativePath));
  }

  for (const htmlPath of htmlFiles) {
    const htmlContent = readFileSync(htmlPath, 'utf8');
    const tsPath = htmlPath.replace(/\.html$/, '.ts');
    let tsContent = '';
    try {
      tsContent = readFileSync(tsPath, 'utf8');
    } catch {
      // TypeScript file might not be co-located
    }
    const relativePath = htmlPath.replace(REPO_ROOT, '').replace(/^[\\/]/, '');
    violations.push(...checkTemplateContent(htmlContent, tsContent, relativePath));
  }

  return violations;
}

function main() {
  console.log('Running ADR-0006 Form Validation & Template Coverage Audit...');

  const allViolations = auditWorkspace();

  if (allViolations.length === 0) {
    console.log('✓ ADR-0006 check passed: All validated form controls have <mat-error> and no TestBed.overrideComponent calls detected.');
    process.exit(0);
  }

  console.warn(`\nFound ${allViolations.length} ADR-0006 audit finding(s):\n`);

  for (const v of allViolations) {
    console.warn(`[${v.rule}] ${v.file}:${v.line}\n  ${v.message}\n`);
  }

  if (process.argv.includes('--strict')) {
    console.error('ADR-0006 check failed under --strict mode.');
    process.exit(1);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main();
}
