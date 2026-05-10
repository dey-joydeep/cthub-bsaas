/* Fix TS2307 + rootDir issues for server libs without impacting web dev:
 * - Create tsconfig.server.base.json (extends tsconfig.base.json) with dist-only paths for server-side deps
 * - Point server libs' tsconfig.lib.json to extend tsconfig.server.base.json
 * - Align outDir/rootDir/include in shared/data-access/core tsconfig.lib.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log('Updated', path.relative(repo, p));
}

// 0) Create server-only base with dist-first (actually dist-only) paths
const serverBasePath = path.join(repo, 'tsconfig.server.base.json');
const serverBase = {
  extends: './tsconfig.base.json',
  compilerOptions: {
    paths: {
      '@cthub-bsaas/shared': ['dist/libs/shared/index.d.ts'],
      '@cthub-bsaas/shared/*': ['dist/libs/shared/*'],
      '@cthub-bsaas/server-data-access': ['dist/libs/server/data-access/index.d.ts'],
      '@cthub-bsaas/server-data-access/*': ['dist/libs/server/data-access/*'],
    },
  },
};
saveJson(serverBasePath, serverBase);

// Helper: patch per-lib tsconfig.lib.json
function patchTsconfigLib(libRoot, outDir, extendToServerBase = false) {
  const tsPath = path.join(repo, libRoot, 'tsconfig.lib.json');
  const conf = loadJson(tsPath);

  if (extendToServerBase) {
    conf['extends'] = path.relative(path.join(repo, libRoot), serverBasePath).replace(/\\/g, '/');
  }

  conf.compilerOptions = conf.compilerOptions || {};
  conf.compilerOptions.outDir = outDir;
  conf.compilerOptions.rootDir = 'src';
  conf.compilerOptions.declaration = true;
  conf.compilerOptions.declarationMap = true;
  conf.compilerOptions.composite = true;

  conf.include = ['src/**/*.ts'];
  if (!conf.exclude) conf.exclude = ['**/*.spec.ts', '**/*.test.ts'];

  saveJson(tsPath, conf);
}

// 1) Align library tsconfigs (output to dist/libs/**)
patchTsconfigLib('libs/shared', '../../dist/libs/shared', false);
patchTsconfigLib('libs/server/data-access', '../../../dist/libs/server/data-access', true);
patchTsconfigLib('libs/server/core', '../../../dist/libs/server/core', true);

// 2) Guidance
console.log(`
Created tsconfig.server.base.json with dist-only path aliases for server-side builds/IDE.

Next:
  npx nx reset
  npx nx build shared
  npx nx build server-data-access
  npx nx build server-core
  # Reload editor / Restart TS server (Windsurf/VSCode) so it picks the new base
`);
