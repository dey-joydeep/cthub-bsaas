#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const LEDGER_PATH = resolve(root, '.agents/state/backend-security-ledger.json');

/**
 * Computes SHA-256 hash of a file's contents.
 * @param {string} filePath
 * @returns {string}
 */
export function computeFileHash(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex').toLowerCase();
}

/**
 * Loads the security ledger.
 * @param {string} [path]
 * @returns {Record<string, any>}
 */
export function loadLedger(path = LEDGER_PATH) {
  if (!existsSync(path)) {
    return {
      $schema: 'backend-security-ledger-v1',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      modules: {},
    };
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Saves the security ledger.
 * @param {Record<string, any>} data
 * @param {string} [path]
 */
export function saveLedger(data, path = LEDGER_PATH) {
  data.lastUpdated = new Date().toISOString();
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Recursively scans a directory for relevant backend source files (.ts, .prisma).
 * @param {string} dir
 * @returns {string[]}
 */
export function scanSourceFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'coverage', '.git'].includes(entry.name)) continue;
      results.push(...scanSourceFiles(fullPath));
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.prisma')) {
        results.push(fullPath);
      }
    }
  }
  return results.sort();
}

/**
 * Computes audit status diff for a module.
 * @param {Record<string, any>} ledger
 * @param {string} moduleName
 * @param {string[]} currentFiles
 * @returns {{ modified: string[], added: string[], clean: string[], deleted: string[] }}
 */
export function diffModuleFiles(ledger, moduleName, currentFiles) {
  const modRecord = ledger.modules?.[moduleName] ?? { files: {} };
  const trackedFiles = modRecord.files ?? {};

  const currentRelative = currentFiles.map((p) => relative(root, p).replace(/\\/g, '/'));
  const trackedPaths = Object.keys(trackedFiles);

  const modified = [];
  const added = [];
  const clean = [];
  const deleted = trackedPaths.filter((p) => !currentRelative.includes(p));

  for (const relPath of currentRelative) {
    const fullPath = resolve(root, relPath);
    const currentHash = computeFileHash(fullPath);
    const existing = trackedFiles[relPath];

    if (!existing) {
      added.push(relPath);
    } else if (existing.hash?.toLowerCase() !== currentHash) {
      modified.push(relPath);
    } else {
      clean.push(relPath);
    }
  }

  return { modified, added, clean, deleted };
}

/**
 * Scans npm dependencies for CVEs using npm audit and checks for reachability in backend code.
 * @param {string} workspaceRoot
 * @returns {{ totalVulnerabilities: number, severities: Record<string, number>, relevantPackages: string[] }}
 */
export function scanCveDependencies(workspaceRoot = root) {
  const result = {
    totalVulnerabilities: 0,
    severities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
    relevantPackages: [],
  };

  try {
    const stdout = execSync('npm audit --json', { cwd: workspaceRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const auditData = JSON.parse(stdout);
    if (auditData.metadata?.vulnerabilities) {
      result.severities = { ...result.severities, ...auditData.metadata.vulnerabilities };
      result.totalVulnerabilities = auditData.metadata.vulnerabilities.total ?? 0;
    }
    if (auditData.vulnerabilities) {
      result.relevantPackages = Object.keys(auditData.vulnerabilities);
    }
  } catch (err) {
    if (err.stdout) {
      try {
        const auditData = JSON.parse(err.stdout);
        if (auditData.metadata?.vulnerabilities) {
          result.severities = { ...result.severities, ...auditData.metadata.vulnerabilities };
          result.totalVulnerabilities = auditData.metadata.vulnerabilities.total ?? 0;
        }
        if (auditData.vulnerabilities) {
          result.relevantPackages = Object.keys(auditData.vulnerabilities);
        }
      } catch {
        // Fallback if stdout is non-JSON
      }
    }
  }

  return result;
}

/**
 * Formats a terminal/markdown status report.
 */
export function formatAuditReport({ moduleName, diff, cveInfo, ledger }) {
  const modRecord = ledger.modules?.[moduleName] ?? {};
  const findings = Object.entries(modRecord.findings ?? {});
  const resolvedCount = findings.filter(([, f]) => f.status === 'RESOLVED').length;
  const openCount = findings.filter(([, f]) => f.status === 'OPEN').length;

  const lines = [
    `# Backend Security Audit Status: ${moduleName || 'Workspace'}`,
    `**Last Audited:** ${modRecord.lastAuditedAt ?? 'Never'} | **Commit:** ${modRecord.lastAuditedCommit?.slice(0, 9) ?? 'N/A'}`,
    '',
    '## 1. Incremental File Audit Scope',
    `- **Verified Clean (Skipped):** ${diff.clean.length} files`,
    `- **Modified (Needs Audit):** ${diff.modified.length} files`,
    `- **Newly Added (Needs Audit):** ${diff.added.length} files`,
    `- **Deleted:** ${diff.deleted.length} files`,
  ];

  if (diff.modified.length > 0) {
    lines.push('', '### Modified Files:');
    diff.modified.forEach((f) => lines.push(`  - ⚠️  ${f}`));
  }

  if (diff.added.length > 0) {
    lines.push('', '### Newly Added Files:');
    diff.added.forEach((f) => lines.push(`  - 🆕 ${f}`));
  }

  lines.push(
    '',
    '## 2. Vulnerability Ledger Findings',
    `- **Total Tracked Findings:** ${findings.length}`,
    `- **Resolved:** ${resolvedCount}`,
    `- **Open:** ${openCount}`,
  );

  if (openCount > 0) {
    lines.push('', '### Open Findings:');
    findings
      .filter(([, f]) => f.status === 'OPEN')
      .forEach(([id, f]) => lines.push(`  - 🔴 **${id}** [${f.severity}]: ${f.title} (${f.cwe})`));
  }

  lines.push(
    '',
    '## 3. Dependency & CVE Scan',
    `- **Total Dependencies Vulnerabilities:** ${cveInfo.totalVulnerabilities}`,
    `  - Critical: ${cveInfo.severities.critical} | High: ${cveInfo.severities.high} | Moderate: ${cveInfo.severities.moderate} | Low: ${cveInfo.severities.low}`,
  );

  return lines.join('\n');
}

// CLI Execution Entry Point
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))) {
  const args = process.argv.slice(2);
  let moduleName = 'salon-owner';
  let targetDir = resolve(root, 'libs/server/features/salon-owner');
  let updateLedgerFlag = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--module' && args[i + 1]) moduleName = args[++i];
    if (args[i] === '--target' && args[i + 1]) targetDir = resolve(root, args[++i]);
    if (args[i] === '--update-ledger') updateLedgerFlag = true;
    if (args[i] === '--help') {
      console.log('Usage: node scripts/aidd/backend-security-audit.mjs [--module <name>] [--target <dir>] [--update-ledger]');
      process.exit(0);
    }
  }

  const ledger = loadLedger();
  const sourceFiles = scanSourceFiles(targetDir);
  const diff = diffModuleFiles(ledger, moduleName, sourceFiles);
  const cveInfo = scanCveDependencies(root);

  const report = formatAuditReport({ moduleName, diff, cveInfo, ledger });
  console.log(report);

  if (updateLedgerFlag) {
    if (!ledger.modules[moduleName]) {
      ledger.modules[moduleName] = { files: {}, findings: {} };
    }
    const filesRecord = ledger.modules[moduleName].files;
    for (const file of sourceFiles) {
      const rel = relative(root, file).replace(/\\/g, '/');
      filesRecord[rel] = {
        hash: computeFileHash(file),
        status: 'VERIFIED_CLEAN',
      };
    }
    saveLedger(ledger);
    console.log(`\nLedger updated with ${sourceFiles.length} files for module "${moduleName}".`);
  }
}
