import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { computeFileHash, loadLedger, saveLedger, diffModuleFiles, formatAuditReport } from './backend-security-audit.mjs';

test('computeFileHash returns valid lowercase sha256', () => {
  const tempDir = join(tmpdir(), `test-sec-hash-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const testFile = join(tempDir, 'test.txt');
  writeFileSync(testFile, 'hello security audit', 'utf8');

  try {
    const hash = computeFileHash(testFile);
    assert.match(hash, /^[a-f0-9]{64}$/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('diffModuleFiles categorizes added, modified, clean, and deleted files', () => {
  const tempDir = join(tmpdir(), `test-sec-diff-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const fileClean = join(tempDir, 'clean.ts');
  const fileMod = join(tempDir, 'mod.ts');
  const fileNew = join(tempDir, 'new.ts');

  writeFileSync(fileClean, 'export const clean = 1;', 'utf8');
  writeFileSync(fileMod, 'export const mod = 2;', 'utf8');
  writeFileSync(fileNew, 'export const newF = 3;', 'utf8');

  const cleanHash = computeFileHash(fileClean);
  const oldModHash = '0000000000000000000000000000000000000000000000000000000000000000';

  const mockLedger = {
    modules: {
      'test-mod': {
        files: {
          [fileClean.replace(/\\/g, '/')]: { hash: cleanHash, status: 'VERIFIED_CLEAN' },
          [fileMod.replace(/\\/g, '/')]: { hash: oldModHash, status: 'VERIFIED_CLEAN' },
          'deleted.ts': { hash: 'abcd', status: 'VERIFIED_CLEAN' },
        },
      },
    },
  };

  try {
    const diff = diffModuleFiles(mockLedger, 'test-mod', [fileClean, fileMod, fileNew]);
    assert.equal(diff.clean.length, 1);
    assert.equal(diff.modified.length, 1);
    assert.equal(diff.added.length, 1);
    assert.equal(diff.deleted.length, 1);
    assert.equal(diff.deleted[0], 'deleted.ts');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('formatAuditReport produces expected markdown blocks', () => {
  const ledger = {
    modules: {
      sample: {
        lastAuditedAt: '2026-11-13T00:00:00Z',
        lastAuditedCommit: 'abc123456789',
        findings: {
          'SEC-01': { severity: 'High', title: 'Test Flaw', cwe: 'CWE-89', status: 'OPEN' },
          'SEC-02': { severity: 'Low', title: 'Closed Flaw', cwe: 'CWE-20', status: 'RESOLVED' },
        },
      },
    },
  };
  const diff = { clean: ['a.ts'], modified: ['b.ts'], added: ['c.ts'], deleted: [] };
  const cveInfo = { totalVulnerabilities: 2, severities: { critical: 0, high: 1, moderate: 1, low: 0 } };

  const report = formatAuditReport({ moduleName: 'sample', diff, cveInfo, ledger });
  assert.match(report, /# Backend Security Audit Status: sample/);
  assert.match(report, /Verified Clean \(Skipped\):\*\* 1 files/);
  assert.match(report, /Modified \(Needs Audit\):\*\* 1 files/);
  assert.match(report, /SEC-01/);
  assert.match(report, /Total Dependencies Vulnerabilities:\*\* 2/);
});
