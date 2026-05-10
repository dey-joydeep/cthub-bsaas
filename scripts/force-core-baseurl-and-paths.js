/* Force baseUrl + flat-dist paths inside server tsconfig.lib.json files (idempotent) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

function jp(p){ return path.join(repo, p); }
function load(p){ return JSON.parse(fs.readFileSync(jp(p), 'utf8')); }
function save(p, o){ fs.writeFileSync(jp(p), JSON.stringify(o, null, 2)+'\n', 'utf8'); console.log('Updated', p); }

const DIST_PATHS = {
  "@cthub-bsaas/shared": ["dist/libs/shared/index.d.ts"],
  "@cthub-bsaas/shared/*": ["dist/libs/shared/*"],
  "@cthub-bsaas/server-data-access": ["dist/libs/server/data-access/index.d.ts"],
  "@cthub-bsaas/server-data-access/*": ["dist/libs/server/data-access/*"]
};

function patch(tsPath) {
  const cfg = load(tsPath);
  cfg.compilerOptions = cfg.compilerOptions || {};
  // Force baseUrl at repo root for these lib builds
  cfg.compilerOptions.baseUrl = ".";
  // Force flat-dist paths (override any inherited mapping)
  cfg.compilerOptions.paths = { ...DIST_PATHS };
  save(tsPath, cfg);
}

[
  'libs/server/core/tsconfig.lib.json',
  'libs/server/data-access/tsconfig.lib.json'
].forEach(p => patch(p));

console.log('\nNow build clean (PowerShell):\n' +
'  npx nx reset\n' +
'  Remove-Item -Recurse -Force dist\n' +
'  npx nx build shared --skip-nx-cache\n' +
'  npx nx build server-data-access --skip-nx-cache\n' +
'  npx nx build server-core --skip-nx-cache\n');
