import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { computeFileHash, loadLedger, saveLedger, diffModuleFiles, formatAuditReport } from './frontend-security-audit.mjs';

test('computeFileHash returns valid lowercase sha256', () => {
  const tempDir = join(tmpdir(), `test-fe-hash-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const testFile = join(tempDir, 'test.component.ts');
  writeFileSync(testFile, 'export class TestComponent {}', 'utf8');

  try {
    const hash = computeFileHash(testFile);
    assert.match(hash, /^[a-f0-9]{64}$/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('diffModuleFiles categorizes added, modified, clean, and deleted frontend files', () => {
  const tempDir = join(tmpdir(), `test-fe-diff-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const fileClean = join(tempDir, 'clean.component.ts');
  const fileMod = join(tempDir, 'mod.component.html');
  const fileNew = join(tempDir, 'new.component.scss');

  writeFileSync(fileClean, 'export class Clean {}', 'utf8');
  writeFileSync(fileMod, '<p>modified</p>', 'utf8');
  writeFileSync(fileNew, '.new { color: red; }', 'utf8');

  const cleanHash = computeFileHash(fileClean);
  const oldModHash = '0000000000000000000000000000000000000000000000000000000000000000';

  const mockLedger = {
    modules: {
      'test-fe-mod': {
        files: {
          [fileClean.replace(/\\/g, '/')]: { hash: cleanHash, status: 'VERIFIED_CLEAN' },
          [fileMod.replace(/\\/g, '/')]: { hash: oldModHash, status: 'VERIFIED_CLEAN' },
          'deleted.component.ts': { hash: 'abcd', status: 'VERIFIED_CLEAN' },
        },
      },
    },
  };

  try {
    const diff = diffModuleFiles(mockLedger, 'test-fe-mod', [fileClean, fileMod, fileNew]);
    assert.equal(diff.clean.length, 1);
    assert.equal(diff.modified.length, 1);
    assert.equal(diff.added.length, 1);
    assert.equal(diff.deleted.length, 1);
    assert.equal(diff.deleted[0], 'deleted.component.ts');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('formatAuditReport produces expected markdown blocks for frontend', () => {
  const ledger = {
    modules: {
      'web-partner': {
        lastAuditedAt: '2026-11-13T00:00:00Z',
        lastAuditedCommit: 'def456789012',
        findings: {
          'SEC-FE-01': { severity: 'High', title: 'DomSanitizer Bypass', cwe: 'CWE-79', status: 'OPEN' },
          'SEC-FE-02': { severity: 'Medium', title: 'LocalStorage Token Storage', cwe: 'CWE-312', status: 'RESOLVED' },
        },
      },
    },
  };
  const diff = { clean: ['a.component.ts'], modified: ['b.component.html'], added: ['c.component.scss'], deleted: [] };
  const cveInfo = { totalVulnerabilities: 3, severities: { critical: 0, high: 2, moderate: 1, low: 0 } };

  const report = formatAuditReport({ moduleName: 'web-partner', diff, cveInfo, ledger });
  assert.match(report, /# Frontend Security Audit Status: web-partner/);
  assert.match(report, /Verified Clean \(Skipped\):\*\* 1 files/);
  assert.match(report, /Modified \(Needs Audit\):\*\* 1 files/);
  assert.match(report, /SEC-FE-01/);
  assert.match(report, /Total Dependencies Vulnerabilities:\*\* 3/);
});
