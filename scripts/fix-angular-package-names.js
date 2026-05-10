/* Fix invalid Angular package names across all workspace package.json files.
 * - Converts @angular/<pkg>/<subpath> to @angular/<pkg>
 * - Moves version range to the corrected key if needed
 * - Deduplicates if both wrong and correct keys exist (keeps the correct one)
 * - Backs up each changed package.json as *.bak.<timestamp>.json
 *
 * Run: node scripts/fix-angular-package-names.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repoRoot   = path.resolve(__dirname, '..');

const BACKUP_TS = new Date().toISOString().replace(/[:.]/g, '-');

function listPkgJsonPaths() {
  const rootPkg = path.join(repoRoot, 'package.json');
  const root = JSON.parse(fs.readFileSync(rootPkg, 'utf8'));
  const workspaces = Array.isArray(root.workspaces) ? root.workspaces : [];
  const results = new Set();

  function addIfPkg(dir) {
    const p = path.join(repoRoot, dir, 'package.json');
    if (fs.existsSync(p)) results.add(p);
  }

  // Expand globs minimally: our workspaces list is explicit paths now
  for (const ws of workspaces) {
    addIfPkg(ws);
  }

  // Always include root itself
  results.add(rootPkg);

  return Array.from(results);
}

function backup(filePath) {
  const bak = `${filePath}.bak.${BACKUP_TS}.json`;
  fs.copyFileSync(filePath, bak);
  return bak;
}

function fixDeps(obj, key) {
  const deps = obj[key];
  if (!deps || typeof deps !== 'object') return { changed: false };

  let changed = false;
  for (const badName of Object.keys(deps)) {
    const m = badName.match(/^@angular\/([^\/]+)\/.+$/);
    if (!m) continue; // only fix names with an extra /subpath
    const correctName = `@angular/${m[1]}`;
    const badRange = deps[badName];

    if (deps[correctName]) {
      // If correct key already exists, drop the bad one
      delete deps[badName];
      changed = true;
    } else {
      // Move the version to the correct key
      deps[correctName] = badRange;
      delete deps[badName];
      changed = true;
    }
  }
  return { changed };
}

function main() {
  const files = listPkgJsonPaths();
  let totalChangedFiles = 0;

  for (const p of files) {
    const json = JSON.parse(fs.readFileSync(p, 'utf8'));
    let changed = false;

    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const res = fixDeps(json, section);
      if (res.changed) changed = true;
    }

    if (changed) {
      const bak = backup(p);
      fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`✔ Fixed Angular package names in ${path.relative(repoRoot, p)} (backup: ${path.relative(repoRoot, bak)})`);
      totalChangedFiles++;
    }
  }

  if (totalChangedFiles === 0) {
    console.log('No invalid Angular package names found. All good!');
  } else {
    console.log(`\nUpdated ${totalChangedFiles} package.json file(s).`);
  }

  console.log('\nNext steps:');
  console.log('  npm i');
}

main();
