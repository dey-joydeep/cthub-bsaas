/* Hard-wire dist path aliases directly into server tsconfig.lib.json files
 * so builds resolve @cthub-bsaas/* even if extends chain is odd.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

function jp(p){ return path.join(repo, p); }
function load(p){ return JSON.parse(fs.readFileSync(jp(p), 'utf8')); }
function save(p, o){ fs.writeFileSync(jp(p), JSON.stringify(o, null, 2) + '\n', 'utf8'); console.log('Updated', p); }

const DIST_PATHS_FLAT = {
  "@cthub-bsaas/shared": ["dist/libs/shared/index.d.ts"],
  "@cthub-bsaas/shared/*": ["dist/libs/shared/*"],
  "@cthub-bsaas/server-data-access": ["dist/libs/server/data-access/index.d.ts"],
  "@cthub-bsaas/server-data-access/*": ["dist/libs/server/data-access/*"]
};

function patchTsconfigLib(tsPath) {
  const cfg = load(tsPath);
  cfg.compilerOptions = cfg.compilerOptions || {};
  cfg.compilerOptions.paths = {
    ...(cfg.compilerOptions.paths || {}),
    ...DIST_PATHS_FLAT
  };
  save(tsPath, cfg);
}

[
  'libs/server/core/tsconfig.lib.json',
  'libs/server/data-access/tsconfig.lib.json'
].forEach(patchTsconfigLib);

console.log('\nNow run (PowerShell):');
console.log('  npx nx reset');
console.log('  Remove-Item -Recurse -Force dist');
console.log('  npx nx build shared --skip-nx-cache');
console.log('  npx nx build server-data-access --skip-nx-cache');
console.log('  npx nx build server-core --skip-nx-cache');
