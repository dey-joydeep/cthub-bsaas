/* Normalize root package.json "workspaces" to EXACT package folders that exist.
 * - Scans apps/** and libs/** for package.json
 * - Excludes dist, node_modules, hidden dirs
 * - Writes explicit relative paths as the workspaces array
 * - Creates a timestamped backup of package.json
 *
 * Run: node scripts/normalize-workspaces.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repoRoot   = path.resolve(__dirname, '..');

const ROOT_PKG = path.join(repoRoot, 'package.json');

function isHidden(name) {
  return name.startsWith('.') || name === '.git';
}
function shouldSkipDir(name) {
  return isHidden(name) || name === 'dist' || name === 'node_modules';
}

function findPackageDirs(root, relBase) {
  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // If current dir has its own package.json, register and DO NOT recurse further.
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const rel = path.relative(root, dir).replace(/\\/g, '/');
      results.push(relBase ? `${relBase}/${rel}` : rel);
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (shouldSkipDir(ent.name)) continue;
      walk(path.join(dir, ent.name));
    }
  }
  walk(root);
  return results.sort();
}

function backup(filePath) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = `${filePath}.bak.${ts}.json`;
  fs.copyFileSync(filePath, bak);
  return bak;
}

function main() {
  if (!fs.existsSync(ROOT_PKG)) {
    console.error('✖ Root package.json not found:', ROOT_PKG);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'));

  // Discover actual package folders
  const appsRoot = path.join(repoRoot, 'apps');
  const libsRoot = path.join(repoRoot, 'libs');

  const appPkgs  = fs.existsSync(appsRoot) ? findPackageDirs(appsRoot, 'apps') : [];
  const libPkgs  = fs.existsSync(libsRoot) ? findPackageDirs(libsRoot, 'libs') : [];

  const workspaces = [...appPkgs, ...libPkgs];

  // Make a backup before writing
  const bakPath = backup(ROOT_PKG);

  // Update workspaces (explicit list); keep other fields as-is
  pkg.workspaces = workspaces;

  fs.writeFileSync(ROOT_PKG, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log('✅ Updated root package.json "workspaces" to explicit package list.');
  console.log('• Backup saved as:', path.relative(repoRoot, bakPath));
  console.log('• Total packages:', workspaces.length);
  for (const ws of workspaces) console.log('  -', ws);

  console.log('\nNext steps:');
  console.log('  - Reinstall to refresh workspace metadata (optional):');
  console.log('      npm i');
  console.log('  - Nx builds are unaffected; this only improves npm workspace hygiene.');
}

main();
